# 🎯 Skill Gap Analysis - Frontend Integration Guide

## 📋 Overview

Sau khi gọi API `/api/ai/skill-gap-analysis`, frontend sẽ nhận được dữ liệu phân tích khoảng cách kỹ năng giữa CV ứng viên và công việc mục tiêu. Document này hướng dẫn cách sử dụng data để tạo trải nghiệm tốt cho user.

---

## 🔄 API Flow

```
1. User selects target job
   ↓
2. Call /api/ai/skill-gap-analysis
   ↓
3. Display skill gap results
   ↓
4. Generate learning roadmap (optional)
   ↓
5. Track learning progress
```

---

## 📊 Step 1: Display Skill Gap Dashboard

### API Response Structure

```typescript
interface SkillGapResponse {
  success: boolean;
  message: string;
  data: {
    missingSkills: MissingSkill[];
    skillsToImprove: SkillToImprove[];
    strongSkills: StrongSkill[];
    learningPriority: LearningItem[];
    overallGapLevel: 'low' | 'medium' | 'high';
    _stats: {
      totalRequired: number;
      matched: number;
      missing: number;
      matchRate: number; // 0-100
    };
  };
}

interface MissingSkill {
  name: string;
  category: 'technical' | 'soft skill' | 'other';
  importance: 'low' | 'medium' | 'high';
  reason: string;
}

interface LearningItem {
  skill: string;
  priority: number; // 1-N (lower is higher priority)
  timeToLearn: string; // e.g., "1-3 months"
  difficulty: 'low' | 'medium' | 'high';
}
```

### UI Components

#### 1. Overview Card
```jsx
<div className="skill-gap-overview">
  <div className="gap-level" data-level={data.overallGapLevel}>
    <h3>Overall Gap Level</h3>
    <span className="badge badge-{data.overallGapLevel}">
      {data.overallGapLevel.toUpperCase()}
    </span>
  </div>
  
  <div className="match-rate">
    <h3>Match Rate</h3>
    <CircularProgress value={data._stats.matchRate} />
    <span>{data._stats.matchRate}%</span>
  </div>
  
  <div className="stats">
    <div>
      <strong>{data._stats.matched}</strong>
      <span>Skills Matched</span>
    </div>
    <div>
      <strong>{data._stats.missing}</strong>
      <span>Skills Missing</span>
    </div>
  </div>
</div>
```

#### 2. Missing Skills Section
```jsx
<div className="missing-skills">
  <h2>Missing Skills</h2>
  
  {/* Group by importance */}
  {['high', 'medium', 'low'].map(importance => {
    const skills = data.missingSkills.filter(s => s.importance === importance);
    if (skills.length === 0) return null;
    
    return (
      <div key={importance} className={`skills-group importance-${importance}`}>
        <h3>
          {importance === 'high' ? '⚠️ High Priority' : 
           importance === 'medium' ? '⚡ Medium Priority' : 
           '💡 Low Priority'}
        </h3>
        
        <div className="skills-list">
          {skills.map(skill => (
            <SkillCard key={skill.name} skill={skill} />
          ))}
        </div>
      </div>
    );
  })}
</div>

function SkillCard({ skill }) {
  return (
    <div className="skill-card">
      <div className="skill-header">
        <h4>{skill.name}</h4>
        <span className="badge">{skill.category}</span>
      </div>
      <p className="reason">{skill.reason}</p>
    </div>
  );
}
```

#### 3. Strong Skills Section (if any)
```jsx
{data.strongSkills.length > 0 && (
  <div className="strong-skills">
    <h2>✅ Your Strengths</h2>
    <div className="skills-grid">
      {data.strongSkills.map(skill => (
        <div key={skill.name} className="skill-badge success">
          <span className="skill-name">{skill.name}</span>
          <span className="relevance">{skill.relevance} relevance</span>
        </div>
      ))}
    </div>
  </div>
)}
```

---

## 🗺️ Step 2: Generate Learning Roadmap

Sau khi user xem skill gap, offer tạo learning roadmap:

### API Call

```typescript
async function generateRoadmap(jobId: string, targetRole: string) {
  const response = await fetch('/api/nlp/learning-roadmap-rag', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      targetJobId: jobId,
      targetRole: targetRole,
      timeframe: 12, // 12 weeks
      useRag: true // Use RAG for real resources
    })
  });
  
  return await response.json();
}
```

### Response Structure

```typescript
interface RoadmapResponse {
  success: boolean;
  data: {
    _id: string;
    targetRole: string;
    skillGaps: SkillGap[];
    phases: Phase[];
    totalDuration: string; // "12 weeks"
    credibilityMetrics: {
      averageCredibility: number;
      verifiedResources: number;
      totalResources: number;
    };
  };
}

interface Phase {
  phaseNumber: number;
  title: string;
  duration: string;
  objectives: string[];
  weeks: Week[];
}

interface Week {
  weekNumber: number;
  topic: string;
  objectives: string[];
  resources: Resource[];
}

interface Resource {
  title: string;
  url: string;
  type: 'course' | 'tutorial' | 'documentation' | 'article';
  estimatedTime: string;
  credibilityScore: number;
  sourceMetadata: {
    platform: string;
    author?: string;
    rating?: number;
  };
}
```

### UI Flow

```jsx
function SkillGapResults({ data, jobId, targetRole }) {
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState(null);
  
  async function handleGenerateRoadmap() {
    setLoading(true);
    try {
      const result = await generateRoadmap(jobId, targetRole);
      setRoadmap(result.data);
      
      // Navigate to roadmap view
      router.push(`/roadmaps/${result.data._id}`);
    } catch (error) {
      toast.error('Failed to generate roadmap');
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div>
      {/* Skill gap display */}
      <SkillGapDashboard data={data} />
      
      {/* Call to action */}
      <div className="cta-section">
        <h3>Ready to close these skill gaps?</h3>
        <p>Generate a personalized learning roadmap with real resources</p>
        
        <button 
          onClick={handleGenerateRoadmap}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? 'Generating...' : '🗺️ Create Learning Roadmap'}
        </button>
      </div>
    </div>
  );
}
```

---

## 📚 Step 3: Display Learning Priority

Show learning priority để giúp user biết học skill nào trước:

```jsx
function LearningPriority({ items }) {
  return (
    <div className="learning-priority">
      <h2>📚 Recommended Learning Order</h2>
      <p className="description">
        Based on skill importance and learning difficulty
      </p>
      
      <div className="priority-list">
        {items.map((item, index) => (
          <div key={item.skill} className="priority-item">
            <div className="rank">#{item.priority}</div>
            
            <div className="content">
              <h4>{item.skill}</h4>
              
              <div className="meta">
                <span className="time">
                  ⏱️ {item.timeToLearn}
                </span>
                <span className={`difficulty difficulty-${item.difficulty}`}>
                  {item.difficulty === 'high' ? '🔴' : 
                   item.difficulty === 'medium' ? '🟡' : '🟢'}
                  {item.difficulty}
                </span>
              </div>
            </div>
            
            {index < items.length - 1 && (
              <div className="arrow">↓</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🎨 Step 4: Visualization Ideas

### 1. Skills Radar Chart
```jsx
import { Radar } from 'react-chartjs-2';

function SkillsRadarChart({ current, required }) {
  const data = {
    labels: required.map(s => s.name),
    datasets: [
      {
        label: 'Current Skills',
        data: current.map(s => s.level || 0),
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgb(54, 162, 235)',
      },
      {
        label: 'Required Skills',
        data: required.map(() => 100), // Full requirement
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgb(255, 99, 132)',
      }
    ]
  };
  
  return <Radar data={data} />;
}
```

### 2. Progress Bar
```jsx
function MatchProgress({ matchRate }) {
  return (
    <div className="match-progress">
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${matchRate}%` }}
        />
      </div>
      <span className="percentage">{matchRate}%</span>
    </div>
  );
}
```

### 3. Timeline View
```jsx
function LearningTimeline({ items }) {
  return (
    <div className="timeline">
      {items.map((item, index) => (
        <div key={item.skill} className="timeline-item">
          <div className="timeline-marker">{index + 1}</div>
          <div className="timeline-content">
            <h4>{item.skill}</h4>
            <p>{item.timeToLearn}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 💡 Step 5: Additional Features

### 1. Save for Later
```typescript
async function saveSkillGapAnalysis(jobId: string, analysisData: any) {
  // Save to local storage or backend
  localStorage.setItem(
    `skill-gap-${jobId}`, 
    JSON.stringify({
      data: analysisData,
      savedAt: new Date().toISOString()
    })
  );
}
```

### 2. Compare Multiple Jobs
```jsx
function CompareJobs({ analyses }) {
  return (
    <div className="compare-view">
      <table>
        <thead>
          <tr>
            <th>Job</th>
            <th>Match Rate</th>
            <th>Missing Skills</th>
            <th>Gap Level</th>
          </tr>
        </thead>
        <tbody>
          {analyses.map(analysis => (
            <tr key={analysis.jobId}>
              <td>{analysis.jobTitle}</td>
              <td>{analysis.data._stats.matchRate}%</td>
              <td>{analysis.data._stats.missing}</td>
              <td>
                <span className={`badge badge-${analysis.data.overallGapLevel}`}>
                  {analysis.data.overallGapLevel}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 3. Export Report
```typescript
function exportSkillGapReport(data: SkillGapResponse['data']) {
  const report = {
    generatedAt: new Date().toISOString(),
    matchRate: data._stats.matchRate,
    overallGapLevel: data.overallGapLevel,
    missingSkills: data.missingSkills,
    learningPriority: data.learningPriority
  };
  
  const blob = new Blob(
    [JSON.stringify(report, null, 2)], 
    { type: 'application/json' }
  );
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `skill-gap-report-${Date.now()}.json`;
  a.click();
}
```

---

## 🎯 Complete Example

```tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SkillGapAnalysisPage() {
  const router = useRouter();
  const { jobId } = router.query;
  
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (jobId) {
      analyzeSkillGap();
    }
  }, [jobId]);
  
  async function analyzeSkillGap() {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/skill-gap-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ jobId })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      setData(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  async function handleGenerateRoadmap() {
    router.push({
      pathname: '/roadmaps/generate',
      query: { jobId, targetRole: data.targetRole }
    });
  }
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return null;
  
  return (
    <div className="skill-gap-page">
      <header>
        <h1>Skill Gap Analysis</h1>
        <p>Compare your skills with job requirements</p>
      </header>
      
      {/* Overview */}
      <OverviewCard data={data} />
      
      {/* Missing Skills */}
      <MissingSkillsSection skills={data.missingSkills} />
      
      {/* Strong Skills */}
      {data.strongSkills.length > 0 && (
        <StrongSkillsSection skills={data.strongSkills} />
      )}
      
      {/* Learning Priority */}
      <LearningPriority items={data.learningPriority} />
      
      {/* Call to Action */}
      <div className="cta-section">
        <button 
          onClick={handleGenerateRoadmap}
          className="btn btn-primary btn-lg"
        >
          🗺️ Create Learning Roadmap
        </button>
      </div>
    </div>
  );
}
```

---

## 📝 API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ai/skill-gap-analysis` | POST | Analyze skill gaps |
| `/api/nlp/learning-roadmap-rag` | POST | Generate learning roadmap |
| `/api/roadmaps/:id` | GET | Get roadmap details |
| `/api/roadmaps/:id/progress` | PUT | Update learning progress |

---

## 🎨 Styling Tips

```css
/* Gap Level Colors */
.badge-high { background: #ef4444; color: white; }
.badge-medium { background: #f59e0b; color: white; }
.badge-low { background: #10b981; color: white; }

/* Skill Categories */
.technical { border-left: 4px solid #3b82f6; }
.soft-skill { border-left: 4px solid #8b5cf6; }

/* Priority Indicators */
.priority-item[data-priority="1"] { border-left: 4px solid #ef4444; }
.priority-item[data-priority="2"] { border-left: 4px solid #f59e0b; }
```

---

## 🚀 Best Practices

1. **Loading States**: Always show loading indicators
2. **Error Handling**: Provide helpful error messages
3. **Empty States**: Handle cases with no missing skills
4. **Mobile Responsive**: Ensure charts work on mobile
5. **Accessibility**: Use proper ARIA labels
6. **Performance**: Lazy load charts and heavy components
7. **Caching**: Cache analysis results to avoid re-computation

---

**Tác giả:** Backend Team  
**Cập nhật:** December 4, 2025  
**Version:** 1.0
