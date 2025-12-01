"""
Generate Charts and Tables for Thesis Chapter 5
Creates publication-quality visualizations and LaTeX tables
"""

import json
import os
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path

# Set publication style
plt.style.use('seaborn-v0_8-paper')
sns.set_palette("husl")

class ThesisVisualizationGenerator:
    """Generate charts and tables for thesis"""
    
    def __init__(self, results_dir='../thesis/results', figures_dir='../thesis/figures', tables_dir='../thesis/tables'):
        # Get script directory and go up to backend folder
        script_dir = Path(__file__).parent
        backend_dir = script_dir.parent
        
        self.results_dir = backend_dir / 'thesis' / 'results'
        self.figures_dir = backend_dir / 'thesis' / 'figures'
        self.tables_dir = backend_dir / 'thesis' / 'tables'
        
        # Create directories
        self.figures_dir.mkdir(parents=True, exist_ok=True)
        self.tables_dir.mkdir(parents=True, exist_ok=True)
    
    def load_evaluation_results(self):
        """Load evaluation results from JSON"""
        results_path = self.results_dir / 'evaluation-results.json'
        
        with open(results_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def generate_comparison_bar_chart(self, results):
        """Generate bar chart comparing model performance"""
        print("📊 Generating comparison bar chart...")
        
        # Filter out metadata key
        models = [k for k in results.keys() if k != 'metadata']
        model_names = [results[m]['modelName'] for m in models]
        
        metrics = ['precision', 'recall', 'f1', 'accuracy']
        metric_labels = ['Precision', 'Recall', 'F1 Score', 'Accuracy']
        
        # Extract data
        data = {metric: [results[m]['avgMetrics'][metric] for m in models] for metric in metrics}
        
        # Create figure
        fig, ax = plt.subplots(figsize=(12, 6))
        
        x = np.arange(len(models))
        width = 0.2
        
        for i, (metric, label) in enumerate(zip(metrics, metric_labels)):
            offset = (i - 1.5) * width
            ax.bar(x + offset, data[metric], width, label=label)
        
        ax.set_xlabel('Models', fontsize=12, fontweight='bold')
        ax.set_ylabel('Score', fontsize=12, fontweight='bold')
        ax.set_title('Skill Extraction Model Performance Comparison', fontsize=14, fontweight='bold')
        ax.set_xticks(x)
        ax.set_xticklabels(model_names, rotation=15, ha='right')
        ax.legend(loc='lower right')
        ax.grid(axis='y', alpha=0.3)
        ax.set_ylim([0, 1.0])
        
        plt.tight_layout()
        
        # Save
        output_path = self.figures_dir / 'model_comparison_bar.png'
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        print(f"   ✅ Saved: {output_path}")
        
        # Also save as PDF for LaTeX
        pdf_path = self.figures_dir / 'model_comparison_bar.pdf'
        plt.savefig(pdf_path, bbox_inches='tight')
        
        plt.close()
    
    def generate_f1_score_comparison(self, results):
        """Generate horizontal bar chart for F1 scores"""
        print("📊 Generating F1 score comparison...")
        
        # Filter out metadata key
        models = [k for k in results.keys() if k != 'metadata']
        model_names = [results[m]['modelName'] for m in models]
        f1_scores = [results[m]['avgMetrics']['f1'] * 100 for m in models]
        
        # Sort by F1 score
        sorted_indices = np.argsort(f1_scores)
        model_names = [model_names[i] for i in sorted_indices]
        f1_scores = [f1_scores[i] for i in sorted_indices]
        
        # Create figure
        fig, ax = plt.subplots(figsize=(10, 6))
        
        colors = sns.color_palette("RdYlGn", len(models))
        bars = ax.barh(model_names, f1_scores, color=colors)
        
        # Add value labels
        for i, (bar, score) in enumerate(zip(bars, f1_scores)):
            ax.text(score + 1, i, f'{score:.1f}%', va='center', fontweight='bold')
        
        ax.set_xlabel('F1 Score (%)', fontsize=12, fontweight='bold')
        ax.set_title('F1 Score Comparison Across Models', fontsize=14, fontweight='bold')
        ax.set_xlim([0, 100])
        ax.grid(axis='x', alpha=0.3)
        
        plt.tight_layout()
        
        output_path = self.figures_dir / 'f1_comparison.png'
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        plt.savefig(self.figures_dir / 'f1_comparison.pdf', bbox_inches='tight')
        print(f"   ✅ Saved: {output_path}")
        
        plt.close()
    
    def generate_precision_recall_plot(self, results):
        """Generate precision-recall scatter plot"""
        print("📊 Generating precision-recall plot...")
        
        # Filter out metadata key
        models = [k for k in results.keys() if k != 'metadata']
        model_names = [results[m]['modelName'] for m in models]
        
        precisions = [results[m]['avgMetrics']['precision'] for m in models]
        recalls = [results[m]['avgMetrics']['recall'] for m in models]
        
        fig, ax = plt.subplots(figsize=(10, 8))
        
        colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']
        
        for i, (name, p, r) in enumerate(zip(model_names, precisions, recalls)):
            ax.scatter(r, p, s=300, c=colors[i], alpha=0.7, edgecolors='black', linewidth=2, label=name)
            ax.annotate(name, (r, p), xytext=(10, 10), textcoords='offset points', fontsize=10)
        
        ax.set_xlabel('Recall', fontsize=12, fontweight='bold')
        ax.set_ylabel('Precision', fontsize=12, fontweight='bold')
        ax.set_title('Precision-Recall Trade-off', fontsize=14, fontweight='bold')
        ax.grid(alpha=0.3)
        ax.set_xlim([0, 1])
        ax.set_ylim([0, 1])
        
        # Add diagonal line (F1 = constant)
        x = np.linspace(0, 1, 100)
        for f1 in [0.5, 0.7, 0.9]:
            y = (f1 * x) / (2 * x - f1)
            y = np.where((y >= 0) & (y <= 1), y, np.nan)
            ax.plot(x, y, '--', alpha=0.3, label=f'F1={f1}')
        
        ax.legend(loc='lower left')
        
        plt.tight_layout()
        
        output_path = self.figures_dir / 'precision_recall.png'
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        plt.savefig(self.figures_dir / 'precision_recall.pdf', bbox_inches='tight')
        print(f"   ✅ Saved: {output_path}")
        
        plt.close()
    
    def generate_latex_table(self, results):
        """Generate LaTeX table for thesis"""
        print("📊 Generating LaTeX table...")
        
        # Filter out metadata key
        models = [k for k in results.keys() if k != 'metadata']
        
        latex = r"""\begin{table}[h]
\centering
\caption{Skill Extraction Model Performance Comparison}
\label{tab:model_comparison}
\begin{tabular}{lcccc}
\hline
\textbf{Model} & \textbf{Precision} & \textbf{Recall} & \textbf{F1 Score} & \textbf{Accuracy} \\
\hline
"""
        
        for model in models:
            name = results[model]['modelName']
            m = results[model]['avgMetrics']
            
            latex += f"{name} & {m['precision']:.3f} & {m['recall']:.3f} & {m['f1']:.3f} & {m['accuracy']:.3f} \\\\\n"
        
        latex += r"""\hline
\end{tabular}
\end{table}
"""
        
        # Save
        output_path = self.tables_dir / 'model_comparison.tex'
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(latex)
        
        print(f"   ✅ Saved: {output_path}")
    
    def generate_inference_time_chart(self, results):
        """Generate inference time comparison"""
        print("📊 Generating inference time chart...")
        
        # Filter out metadata key
        models = [k for k in results.keys() if k != 'metadata']
        model_names = [results[m]['modelName'] for m in models]
        times = [float(results[m]['processingTime']['avgPerCV']) for m in models]
        
        fig, ax = plt.subplots(figsize=(10, 6))
        
        bars = ax.bar(model_names, times, color=sns.color_palette("Blues_d", len(models)))
        
        # Add value labels
        for bar, time in zip(bars, times):
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height,
                   f'{time:.1f}ms', ha='center', va='bottom', fontweight='bold')
        
        ax.set_ylabel('Average Inference Time (ms)', fontsize=12, fontweight='bold')
        ax.set_title('Model Inference Speed Comparison', fontsize=14, fontweight='bold')
        ax.set_xticklabels(model_names, rotation=15, ha='right')
        ax.grid(axis='y', alpha=0.3)
        
        plt.tight_layout()
        
        output_path = self.figures_dir / 'inference_time.png'
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        plt.savefig(self.figures_dir / 'inference_time.pdf', bbox_inches='tight')
        print(f"   ✅ Saved: {output_path}")
        
        plt.close()
    
    def generate_all_visualizations(self):
        """Generate all charts and tables"""
        print(f"""
╔═══════════════════════════════════════════╗
║   Thesis Visualization Generator v1.0    ║
║   Publication-Quality Charts & Tables    ║
╚═══════════════════════════════════════════╝
        """)
        
        # Load results
        print("📂 Loading evaluation results...")
        results = self.load_evaluation_results()
        print(f"   ✅ Loaded results for {len(results)} models\n")
        
        # Generate visualizations
        self.generate_comparison_bar_chart(results)
        self.generate_f1_score_comparison(results)
        self.generate_precision_recall_plot(results)
        self.generate_inference_time_chart(results)
        
        # Generate LaTeX table
        self.generate_latex_table(results)
        
        print(f"""
╔═══════════════════════════════════════════╗
║         GENERATION COMPLETE              ║
╚═══════════════════════════════════════════╝

📁 Output Directories:
   Figures: {self.figures_dir}
   Tables: {self.tables_dir}

📊 Generated Files:
   - model_comparison_bar.png/pdf
   - f1_comparison.png/pdf
   - precision_recall.png/pdf
   - inference_time.png/pdf
   - model_comparison.tex (LaTeX table)

✅ Ready to insert into thesis Chapter 5!

📝 LaTeX Usage:
   \\includegraphics[width=0.8\\textwidth]{{figures/model_comparison_bar.pdf}}
   \\input{{tables/model_comparison.tex}}
        """)


def main():
    generator = ThesisVisualizationGenerator()
    generator.generate_all_visualizations()


if __name__ == '__main__':
    main()
