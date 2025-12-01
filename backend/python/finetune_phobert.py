"""
PhoBERT Fine-tuning for CV Skill Extraction (NER Task)
Fine-tune vinai/phobert-base on Vietnamese resume data

Usage:
    python finetune_phobert.py --data_dir ../thesis/datasets/processed --output_dir ./models/phobert-cv-ner

Requirements:
    transformers>=4.30.0
    torch>=2.0.0
    datasets>=2.12.0
    accelerate>=0.20.0
    evaluate>=0.4.0
    seqeval>=1.2.2
"""

import json
import os
import argparse
from pathlib import Path
from typing import Dict, List, Tuple

import torch
from transformers import (
    AutoTokenizer,
    AutoModelForTokenClassification,
    TrainingArguments,
    Trainer,
    DataCollatorForTokenClassification,
    EarlyStoppingCallback
)
from datasets import Dataset, DatasetDict, load_metric
import numpy as np


class CVDataProcessor:
    """Process CV data for NER task"""
    
    def __init__(self, tokenizer):
        self.tokenizer = tokenizer
        self.label_list = [
            'O',          # Outside any entity
            'B-SKILL',    # Begin skill
            'I-SKILL',    # Inside skill
            'B-EDU',      # Begin education
            'I-EDU',      # Inside education
            'B-EXP',      # Begin experience
            'I-EXP',      # Inside experience
            'B-CERT',     # Begin certification
            'I-CERT'      # Inside certification
        ]
        self.label2id = {label: i for i, label in enumerate(self.label_list)}
        self.id2label = {i: label for label, i in self.label2id.items()}
    
    def load_jsonl(self, filepath: str) -> List[Dict]:
        """Load JSONL file"""
        data = []
        with open(filepath, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    data.append(json.loads(line))
        return data
    
    def extract_text_and_labels(self, cv_data: Dict) -> Tuple[List[str], List[str]]:
        """Extract tokens and labels from CV data"""
        # Get raw text
        raw_text = cv_data.get('rawText', '')
        if not raw_text:
            return [], []
        
        # Simple tokenization (word-level)
        words = raw_text.split()
        labels = ['O'] * len(words)
        
        # Label skills
        cv = cv_data.get('cv', {})
        skills = cv.get('skills', [])
        
        for skill in skills:
            # Find skill in text and label it
            skill_words = skill.split()
            for i in range(len(words) - len(skill_words) + 1):
                if words[i:i+len(skill_words)] == skill_words:
                    labels[i] = 'B-SKILL'
                    for j in range(1, len(skill_words)):
                        labels[i+j] = 'I-SKILL'
        
        return words, labels
    
    def tokenize_and_align_labels(self, examples):
        """Tokenize and align labels with subwords"""
        tokenized_inputs = self.tokenizer(
            examples['tokens'],
            truncation=True,
            is_split_into_words=True,
            padding='max_length',
            max_length=512
        )
        
        labels = []
        for i, label in enumerate(examples['ner_tags']):
            word_ids = tokenized_inputs.word_ids(batch_index=i)
            label_ids = []
            previous_word_idx = None
            
            for word_idx in word_ids:
                if word_idx is None:
                    label_ids.append(-100)  # Special tokens
                elif word_idx != previous_word_idx:
                    label_ids.append(self.label2id[label[word_idx]])
                else:
                    # For subwords, use same label as first subword
                    label_ids.append(self.label2id[label[word_idx]])
                previous_word_idx = word_idx
            
            labels.append(label_ids)
        
        tokenized_inputs['labels'] = labels
        return tokenized_inputs
    
    def prepare_dataset(self, data_dir: str) -> DatasetDict:
        """Prepare dataset for training"""
        print(f"📂 Loading data from {data_dir}")
        
        datasets = {}
        for split in ['train', 'val', 'test']:
            filepath = os.path.join(data_dir, f'{split}.jsonl')
            
            if not os.path.exists(filepath):
                print(f"⚠️  {filepath} not found, skipping...")
                continue
            
            print(f"   Loading {split}.jsonl...")
            raw_data = self.load_jsonl(filepath)
            
            # Extract tokens and labels
            all_tokens = []
            all_labels = []
            
            for item in raw_data:
                tokens, labels = self.extract_text_and_labels(item)
                if tokens and labels:
                    all_tokens.append(tokens)
                    all_labels.append(labels)
            
            print(f"   ✅ {split}: {len(all_tokens)} examples")
            
            # Create HuggingFace Dataset
            datasets[split] = Dataset.from_dict({
                'tokens': all_tokens,
                'ner_tags': all_labels
            })
        
        dataset_dict = DatasetDict(datasets)
        
        # Tokenize
        print("\n🔤 Tokenizing datasets...")
        tokenized_datasets = dataset_dict.map(
            self.tokenize_and_align_labels,
            batched=True,
            remove_columns=['tokens', 'ner_tags']
        )
        
        return tokenized_datasets


def compute_metrics(eval_pred):
    """Compute NER metrics (precision, recall, F1)"""
    metric = load_metric('seqeval')
    
    predictions, labels = eval_pred
    predictions = np.argmax(predictions, axis=2)
    
    # Remove ignored index (special tokens)
    true_predictions = []
    true_labels = []
    
    label_list = [
        'O', 'B-SKILL', 'I-SKILL', 'B-EDU', 'I-EDU',
        'B-EXP', 'I-EXP', 'B-CERT', 'I-CERT'
    ]
    
    for prediction, label in zip(predictions, labels):
        true_preds = []
        true_labs = []
        for pred_id, label_id in zip(prediction, label):
            if label_id != -100:
                true_preds.append(label_list[pred_id])
                true_labs.append(label_list[label_id])
        true_predictions.append(true_preds)
        true_labels.append(true_labs)
    
    results = metric.compute(predictions=true_predictions, references=true_labels)
    
    return {
        'precision': results['overall_precision'],
        'recall': results['overall_recall'],
        'f1': results['overall_f1'],
        'accuracy': results['overall_accuracy']
    }


def train_phobert(args):
    """Main training function"""
    print(f"""
╔═══════════════════════════════════════════╗
║   PhoBERT Fine-tuning for CV NER         ║
║   Model: vinai/phobert-base              ║
╚═══════════════════════════════════════════╝
    """)
    
    # Load tokenizer and model
    print("📥 Loading PhoBERT tokenizer and model...")
    tokenizer = AutoTokenizer.from_pretrained('vinai/phobert-base')
    
    processor = CVDataProcessor(tokenizer)
    
    model = AutoModelForTokenClassification.from_pretrained(
        'vinai/phobert-base',
        num_labels=len(processor.label_list),
        id2label=processor.id2label,
        label2id=processor.label2id
    )
    
    print(f"✅ Model loaded with {len(processor.label_list)} labels")
    
    # Prepare dataset
    dataset = processor.prepare_dataset(args.data_dir)
    
    # Training arguments
    training_args = TrainingArguments(
        output_dir=args.output_dir,
        evaluation_strategy='epoch',
        save_strategy='epoch',
        learning_rate=2e-5,
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=args.batch_size,
        num_train_epochs=args.epochs,
        weight_decay=0.01,
        logging_dir=f'{args.output_dir}/logs',
        logging_steps=50,
        load_best_model_at_end=True,
        metric_for_best_model='f1',
        save_total_limit=2,
        push_to_hub=args.push_to_hub,
        hub_model_id=args.hub_model_id if args.push_to_hub else None,
        report_to='tensorboard',
        fp16=torch.cuda.is_available(),  # Use mixed precision if GPU available
    )
    
    # Data collator
    data_collator = DataCollatorForTokenClassification(tokenizer)
    
    # Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=dataset['train'],
        eval_dataset=dataset.get('val', dataset.get('test')),
        tokenizer=tokenizer,
        data_collator=data_collator,
        compute_metrics=compute_metrics,
        callbacks=[EarlyStoppingCallback(early_stopping_patience=3)]
    )
    
    # Train
    print("\n🚀 Starting training...")
    train_result = trainer.train()
    
    # Evaluate
    print("\n📊 Evaluating on test set...")
    if 'test' in dataset:
        metrics = trainer.evaluate(dataset['test'])
        print(f"\n✅ Test Results:")
        print(f"   Precision: {metrics['eval_precision']:.4f}")
        print(f"   Recall: {metrics['eval_recall']:.4f}")
        print(f"   F1: {metrics['eval_f1']:.4f}")
        print(f"   Accuracy: {metrics['eval_accuracy']:.4f}")
    
    # Save model
    print(f"\n💾 Saving model to {args.output_dir}")
    trainer.save_model()
    tokenizer.save_pretrained(args.output_dir)
    
    # Save label mapping
    with open(os.path.join(args.output_dir, 'label_mapping.json'), 'w') as f:
        json.dump({
            'label2id': processor.label2id,
            'id2label': processor.id2label
        }, f, indent=2)
    
    print("\n✅ Training complete!")
    
    if args.push_to_hub:
        print(f"\n🤗 Pushing to Hugging Face Hub: {args.hub_model_id}")
        trainer.push_to_hub()


def main():
    parser = argparse.ArgumentParser(description='Fine-tune PhoBERT for CV NER')
    
    parser.add_argument(
        '--data_dir',
        type=str,
        default='../thesis/datasets/processed',
        help='Directory containing train/val/test jsonl files'
    )
    
    parser.add_argument(
        '--output_dir',
        type=str,
        default='./models/phobert-cv-ner',
        help='Output directory for model checkpoints'
    )
    
    parser.add_argument(
        '--batch_size',
        type=int,
        default=16,
        help='Batch size for training'
    )
    
    parser.add_argument(
        '--epochs',
        type=int,
        default=10,
        help='Number of training epochs'
    )
    
    parser.add_argument(
        '--push_to_hub',
        action='store_true',
        help='Push model to Hugging Face Hub'
    )
    
    parser.add_argument(
        '--hub_model_id',
        type=str,
        default=None,
        help='Hugging Face model ID (e.g., username/model-name)'
    )
    
    args = parser.parse_args()
    
    # Create output directory
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Train
    train_phobert(args)


if __name__ == '__main__':
    main()
