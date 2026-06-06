'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@executive-health/ui';
import type { MealLog, NutritionGoal, FoodItem } from '@executive-health/db';
import type { DailyNutritionSummary, NutritionAlert, MealPlanSuggestion } from '@executive-health/nutrition';
import type { MealSuggestion } from '@executive-health/nutrition';

interface NutritionDashboardData {
  daily_nutrition: DailyNutritionSummary;
  alerts: NutritionAlert[];
  goal: NutritionGoal | null;
  recent_logs: MealLog[];
  weekly_summary: {
    avg_daily_calories: number;
    avg_daily_protein: number;
    avg_daily_carbs: number;
    avg_daily_fat: number;
    avg_daily_sodium: number;
    days_logged: number;
  };
}

function getBarColor(pct: number): string {
  if (pct >= 90 && pct <= 110) return '#22c55e';
  if (pct >= 70 && pct <= 130) return '#eab308';
  if (pct > 130) return '#ef4444';
  return '#f97316';
}

const MEAL_TYPES = [
  { value: 'breakfast', label: '🌅 Breakfast' },
  { value: 'lunch', label: '☀️ Lunch' },
  { value: 'dinner', label: '🌆 Dinner' },
  { value: 'snack', label: '🍪 Snack' },
];

const CUISINES = [
  { value: 'nigerian', label: '🇳🇬 Nigerian' },
  { value: 'western', label: '🍔 Western' },
  { value: 'asian', label: '🥡 Asian' },
  { value: 'mediterranean', label: '🫒 Mediterranean' },
  { value: 'other', label: '🌍 Other' },
];

function formatDateForInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function NutritionPage() {
  const router = useRouter();
  const [data, setData] = useState<NutritionDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'log' | 'goals' | 'plan'>('log');

  // Suggestions
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [mealPlanSuggestions, setMealPlanSuggestions] = useState<MealPlanSuggestion[]>([]);
  const [suggestionCuisine, setSuggestionCuisine] = useState('nigerian');

  // Meal log form
  const today = formatDateForInput(new Date());
  const [form, setForm] = useState({
    date: today,
    meal_type: 'breakfast' as MealLog['meal_type'],
    cuisine: 'nigerian' as MealLog['cuisine'],
    notes: '',
  });

  // Food items for the current meal
  const [foodItems, setFoodItems] = useState<FoodItem[]>([
    { name: '', portion: '', calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, sodium_mg: 0 },
  ]);

  // Nutrition goal form
  const [goalForm, setGoalForm] = useState({
    daily_calories: 2500,
    protein_g: 120,
    carbs_g: 300,
    fat_g: 70,
    sodium_mg: 2300,
    cuisine_preference: ['nigerian'],
    dietary_restrictions: [] as string[],
  });

  // Quick-add food name search
  const [foodSearch, setFoodSearch] = useState('');

  const fetchData = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/auth/login'); return; }
    fetch('/api/nutrition', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(res => {
        if (res.error) { router.push('/auth/login'); return; }
        setData(res);
        // Initialize goal form from existing goal
        if (res.goal) {
          setGoalForm({
            daily_calories: res.goal.daily_calories,
            protein_g: res.goal.protein_g,
            carbs_g: res.goal.carbs_g,
            fat_g: res.goal.fat_g,
            sodium_mg: res.goal.sodium_mg,
            cuisine_preference: res.goal.cuisine_preference,
            dietary_restrictions: res.goal.dietary_restrictions,
          });
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  const fetchSuggestions = useCallback((cuisine: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`/api/nutrition/suggestions?cuisine=${cuisine}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(res => {
        if (!res.error) setSuggestions(res.suggestions || []);
      });
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchSuggestions(suggestionCuisine); }, [suggestionCuisine, fetchSuggestions]);

  // Auto-suggest from suggestions when searching
  const filteredSuggestions = foodSearch
    ? suggestions.filter(s =>
        s.name.toLowerCase().includes(foodSearch.toLowerCase()) &&
        s.meal_type === form.meal_type
      )
    : [];

  const addFoodFromSuggestion = (s: MealSuggestion, idx: number) => {
    const newItems = [...foodItems];
    newItems[idx] = {
      name: s.name,
      portion: '1 serving',
      calories: s.calories,
      protein_g: s.protein_g,
      carbs_g: s.carbs_g,
      fat_g: s.fat_g,
      sodium_mg: s.sodium_mg,
    };
    setFoodItems(newItems);
    setFoodSearch('');
  };

  const addFoodRow = () => {
    setFoodItems([...foodItems, { name: '', portion: '', calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, sodium_mg: 0 }]);
  };

  const removeFoodRow = (idx: number) => {
    if (foodItems.length <= 1) return;
    setFoodItems(foodItems.filter((_, i) => i !== idx));
  };

  const updateFoodItem = (idx: number, field: keyof FoodItem, value: string | number) => {
    const newItems = [...foodItems];
    (newItems[idx] as any)[field] = value;
    setFoodItems(newItems);
  };

  const calculateTotals = () => {
    return foodItems.reduce(
      (acc, item) => ({
        total_calories: acc.total_calories + (Number(item.calories) || 0),
        total_protein_g: acc.total_protein_g + (Number(item.protein_g) || 0),
        total_carbs_g: acc.total_carbs_g + (Number(item.carbs_g) || 0),
        total_fat_g: acc.total_fat_g + (Number(item.fat_g) || 0),
        total_sodium_mg: acc.total_sodium_mg + (Number(item.sodium_mg) || 0),
      }),
      { total_calories: 0, total_protein_g: 0, total_carbs_g: 0, total_fat_g: 0, total_sodium_mg: 0 },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    const token = localStorage.getItem('token');
    if (!token) { router.push('/auth/login'); return; }

    const validFoods = foodItems.filter(f => f.name.trim());
    if (validFoods.length === 0) {
      setError('Please add at least one food item');
      setSubmitting(false);
      return;
    }

    const totals = calculateTotals();

    try {
      const res = await fetch('/api/nutrition/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: form.date,
          meal_type: form.meal_type,
          foods: validFoods,
          ...totals,
          cuisine: form.cuisine,
          notes: form.notes || undefined,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        setSuccess('Meal logged successfully!');
        fetchData();
        setFoodItems([{ name: '', portion: '', calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, sodium_mg: 0 }]);
        setForm(p => ({ ...p, notes: '' }));
      } else {
        setError(json.error || 'Failed to save');
      }
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSavingGoal(true);

    const token = localStorage.getItem('token');
    if (!token) { router.push('/auth/login'); return; }

    try {
      const res = await fetch('/api/nutrition/goal', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(goalForm),
      });

      const json = await res.json();
      if (res.ok) {
        setSuccess('Nutrition goals updated!');
        fetchData();
      } else {
        setError(json.error || 'Failed to save goals');
      }
    } catch {
      setError('Network error');
    } finally {
      setSavingGoal(false);
    }
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="eh-empty">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPath="/nutrition" onNavigate={(p) => router.push(p)}>
      <div className="eh-content">
        <h1 className="eh-page-title">🥗 Nutrition & Lifestyle</h1>
        <p className="eh-page-subtitle">Track your meals and meet your nutrition goals</p>

        {/* Error/Success Messages */}
        {error && (
          <div className="eh-alert-error">
            {error}
          </div>
        )}
        {success && (
          <div className="eh-alert-success">
            {success}
          </div>
        )}

        {/* Daily Summary Cards */}
        <div className="eh-grid-4 eh-gap-12 eh-mb-24">
          {[
            { label: 'Calories', current: data?.daily_nutrition?.total_calories || 0, target: data?.goal?.daily_calories || 2500, unit: 'kcal', color: '#60a5fa' },
            { label: 'Protein', current: data?.daily_nutrition?.total_protein_g || 0, target: data?.goal?.protein_g || 120, unit: 'g', color: '#34d399' },
            { label: 'Carbs', current: data?.daily_nutrition?.total_carbs_g || 0, target: data?.goal?.carbs_g || 300, unit: 'g', color: '#f59e0b' },
            { label: 'Fat', current: data?.daily_nutrition?.total_fat_g || 0, target: data?.goal?.fat_g || 70, unit: 'g', color: '#a78bfa' },
          ].map(item => {
            const pct = item.target > 0 ? Math.round((item.current / item.target) * 100) : 0;
            const barColor = getBarColor(pct);
            return (
              <div key={item.label} className="eh-stat-tile">
                <span className="eh-stat-label">{item.label}</span>
                <div style={{ fontSize: 24, fontWeight: 700, color: barColor }}>{item.current}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>/ {item.target} {item.unit}</div>
                <div style={{ marginTop: 10, height: 4, backgroundColor: '#0f0f23', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, backgroundColor: barColor, borderRadius: 2, transition: 'width 0.5s ease' }} />
                </div>
                <div style={{ fontSize: 11, color: barColor, marginTop: 4, fontWeight: 600 }}>{pct}%</div>
              </div>
            );
          })}
        </div>

        {/* Food Risk Alerts */}
        {data?.alerts && data.alerts.length > 0 && (
          <div className="eh-mb-24">
            {data.alerts.map((alert, i) => {
              const bgColor = alert.type === 'danger' ? '#451a1a' : alert.type === 'warning' ? '#3d2e0a' : alert.type === 'success' ? '#14532d' : '#1a1a3e';
              const borderColor = alert.type === 'danger' ? '#ef4444' : alert.type === 'warning' ? '#eab308' : alert.type === 'success' ? '#22c55e' : '#3b82f6';
              const icon = alert.type === 'danger' ? '🔴' : alert.type === 'warning' ? '🟡' : alert.type === 'success' ? '✅' : 'ℹ️';
              return (
                <div key={i} style={{
                  backgroundColor: bgColor,
                  borderRadius: 12,
                  padding: '12px 20px',
                  border: `1px solid ${borderColor}`,
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  <span style={{ fontSize: 20 }}>{icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#ffffff', fontSize: 13, marginBottom: 2 }}>{alert.message}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                      Current: {alert.current_value}{alert.unit} | Target: {alert.target_value}{alert.unit}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="eh-flex-wrap eh-gap-12 eh-mb-24">
          <button
            className="eh-btn"
            style={{ backgroundColor: activeTab === 'log' ? '#3b82f6' : 'var(--bg-secondary)', color: activeTab === 'log' ? '#ffffff' : '#94a3b8', fontWeight: activeTab === 'log' ? 600 : 400 }}
            onClick={() => setActiveTab('log')}
          >
            📝 Log Meal
          </button>
          <button
            className="eh-btn"
            style={{ backgroundColor: activeTab === 'goals' ? '#3b82f6' : 'var(--bg-secondary)', color: activeTab === 'goals' ? '#ffffff' : '#94a3b8', fontWeight: activeTab === 'goals' ? 600 : 400 }}
            onClick={() => setActiveTab('goals')}
          >
            🎯 Goals
          </button>
          <button
            className="eh-btn"
            style={{ backgroundColor: activeTab === 'plan' ? '#3b82f6' : 'var(--bg-secondary)', color: activeTab === 'plan' ? '#ffffff' : '#94a3b8', fontWeight: activeTab === 'plan' ? 600 : 400 }}
            onClick={() => setActiveTab('plan')}
          >
            📋 Meal Plan
          </button>
        </div>

        {/* Log Meal Form */}
        {activeTab === 'log' && (
          <div className="eh-card">
            <h3 className="eh-section-title">
              📝 Log Today&apos;s Meal
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="eh-grid-3 eh-gap-12 eh-mb-24">
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>Date</label>
                  <input className="eh-input" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>Meal Type</label>
                  <select className="eh-input" value={form.meal_type} onChange={e => setForm(p => ({ ...p, meal_type: e.target.value as MealLog['meal_type'] }))} required>
                    {MEAL_TYPES.map(mt => (
                      <option key={mt.value} value={mt.value}>{mt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>Cuisine</label>
                  <select className="eh-input" value={form.cuisine} onChange={e => setForm(p => ({ ...p, cuisine: e.target.value as MealLog['cuisine'] }))} required>
                    {CUISINES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Food Items */}
              <div className="eh-mb-24">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ display: 'block', fontSize: 13, color: '#94a3b8' }}>Food Items</label>
                  <button type="button" onClick={addFoodRow} className="eh-btn eh-btn-sm">
                    + Add Food
                  </button>
                </div>

                {/* Search/Quick Add from suggestions */}
                  <div style={{ position: 'relative', marginBottom: 12 }}>
                    <input
                      className="eh-input"
                      type="text"
                      placeholder="🔍 Search meals to auto-fill..."
                      value={foodSearch}
                      onChange={e => setFoodSearch(e.target.value)}
                    />
                    {suggestions.length === 0 && !foodSearch && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0,
                        padding: '12px 14px', fontSize: 13, color: '#6b7280',
                        backgroundColor: '#1a1a2e', border: '1px solid #2a2a4e',
                        borderTop: 0, borderRadius: '0 0 8px 8px', zIndex: 10,
                      }}>
                        No food suggestions loaded — check your cuisine preference
                      </div>
                    )}
                    {filteredSuggestions.length > 0 && foodSearch && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0,
                        backgroundColor: '#1a1a2e', border: '1px solid #2a2a4e',
                        borderRadius: '0 0 8px 8px', zIndex: 10, maxHeight: 200, overflowY: 'auto',
                      }}>
                        {filteredSuggestions.slice(0, 5).map(s => (
                          <div
                            key={s.name}
                            onClick={() => {
                              // Fill the first empty food row
                              const idx = foodItems.findIndex(f => !f.name.trim());
                              if (idx >= 0) addFoodFromSuggestion(s, idx);
                            }}
                            style={{
                              padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #2a2a4e',
                              fontSize: 13, color: '#e2e8f0',
                              display: 'flex', justifyContent: 'space-between',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#16213e')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <span>{s.name}</span>
                            <span style={{ color: '#94a3b8' }}>{s.calories} kcal</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                {foodItems.map((item, idx) => (
                  <div key={idx} style={{
                    display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr auto',
                    gap: 8, marginBottom: 8, alignItems: 'center',
                  }}>
                    <input
                      className="eh-input"
                      placeholder="Food name"
                      value={item.name}
                      onChange={e => updateFoodItem(idx, 'name', e.target.value)}
                      required
                    />
                    <input
                      className="eh-input"
                      placeholder="Portion"
                      value={item.portion}
                      onChange={e => updateFoodItem(idx, 'portion', e.target.value)}
                    />
                    <input
                      className="eh-input"
                      type="number"
                      placeholder="Cal"
                      value={item.calories || ''}
                      onChange={e => updateFoodItem(idx, 'calories', Number(e.target.value))}
                    />
                    <input
                      className="eh-input"
                      type="number"
                      placeholder="Prot(g)"
                      value={item.protein_g || ''}
                      onChange={e => updateFoodItem(idx, 'protein_g', Number(e.target.value))}
                    />
                    <input
                      className="eh-input"
                      type="number"
                      placeholder="Carb(g)"
                      value={item.carbs_g || ''}
                      onChange={e => updateFoodItem(idx, 'carbs_g', Number(e.target.value))}
                    />
                    <input
                      className="eh-input"
                      type="number"
                      placeholder="Fat(g)"
                      value={item.fat_g || ''}
                      onChange={e => updateFoodItem(idx, 'fat_g', Number(e.target.value))}
                    />
                    <button
                      type="button"
                      onClick={() => removeFoodRow(idx)}
                      style={{
                        background: 'none', border: 'none', color: '#ef4444',
                        fontSize: 18, cursor: 'pointer', padding: '4px 8px',
                      }}
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {/* Auto-calculated totals */}
                <div style={{
                  backgroundColor: '#0f0f23', borderRadius: 8, padding: '12px 16px',
                  display: 'flex', gap: 24, justifyContent: 'center', fontSize: 13,
                }}>
                  <span style={{ color: '#94a3b8' }}>Totals:</span>
                  <span style={{ color: '#60a5fa', fontWeight: 600 }}>{totals.total_calories} kcal</span>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>{totals.total_protein_g}g protein</span>
                  <span style={{ color: '#f59e0b', fontWeight: 600 }}>{totals.total_carbs_g}g carbs</span>
                  <span style={{ color: '#a78bfa', fontWeight: 600 }}>{totals.total_fat_g}g fat</span>
                  <span style={{ color: '#f87171', fontWeight: 600 }}>{totals.total_sodium_mg}mg sodium</span>
                </div>
              </div>

              <div className="eh-mb-24">
                <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>Notes (optional)</label>
                <textarea
                  className="eh-input"
                  style={{ minHeight: 60, resize: 'vertical' }}
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="e.g., Had extra helping, felt bloated..."
                />
              </div>

              <button className="eh-btn eh-btn-primary" style={{ opacity: submitting ? 0.6 : 1 }} type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : '💾 Save Meal'}
              </button>
            </form>
          </div>
        )}

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <div className="eh-card">
            <h3 className="eh-section-title">
              🎯 Daily Nutrition Goals
            </h3>
            <form onSubmit={handleSaveGoal}>
              <div className="eh-grid-2 eh-gap-12 eh-mb-24">
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>Daily Calories (kcal)</label>
                  <input className="eh-input" type="number" min="1000" max="6000" value={goalForm.daily_calories} onChange={e => setGoalForm(p => ({ ...p, daily_calories: Number(e.target.value) }))} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>Protein Target (g)</label>
                  <input className="eh-input" type="number" min="10" value={goalForm.protein_g} onChange={e => setGoalForm(p => ({ ...p, protein_g: Number(e.target.value) }))} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>Carbs Target (g)</label>
                  <input className="eh-input" type="number" min="10" value={goalForm.carbs_g} onChange={e => setGoalForm(p => ({ ...p, carbs_g: Number(e.target.value) }))} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>Fat Target (g)</label>
                  <input className="eh-input" type="number" min="10" value={goalForm.fat_g} onChange={e => setGoalForm(p => ({ ...p, fat_g: Number(e.target.value) }))} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>Sodium Limit (mg)</label>
                  <input className="eh-input" type="number" min="500" value={goalForm.sodium_mg} onChange={e => setGoalForm(p => ({ ...p, sodium_mg: Number(e.target.value) }))} required />
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>WHO recommends &lt;2,300mg/day</div>
                </div>
              </div>
              <button className="eh-btn eh-btn-primary" style={{ opacity: savingGoal ? 0.6 : 1 }} type="submit" disabled={savingGoal}>
                {savingGoal ? 'Saving...' : '💾 Save Goals'}
              </button>
            </form>
          </div>
        )}

        {/* Meal Plan Tab */}
        {activeTab === 'plan' && (
          <div>
            {/* Cuisine filter */}
            <div className="eh-flex-wrap eh-gap-12 eh-mb-24">
              <span style={{ color: '#94a3b8', fontSize: 14 }}>Filter cuisine:</span>
              {['nigerian', 'western', 'asian', 'mediterranean'].map(c => (
                <button
                  key={c}
                  onClick={() => setSuggestionCuisine(c)}
                  style={{
                    padding: '6px 16px', borderRadius: 20, border: suggestionCuisine === c ? '2px solid #3b82f6' : '1px solid #2a2a4e',
                    backgroundColor: suggestionCuisine === c ? '#1e3a5f' : 'transparent',
                    color: suggestionCuisine === c ? '#ffffff' : '#94a3b8',
                    fontSize: 12, cursor: 'pointer', fontWeight: suggestionCuisine === c ? 600 : 400,
                  }}
                >
                  {c === 'nigerian' ? '🇳🇬' : c === 'western' ? '🍔' : c === 'asian' ? '🥡' : '🫒'} {c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              ))}
            </div>

            {/* Meal suggestions by type */}
            <div style={{ display: 'grid', gap: 16 }}>
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(mealType => {
                const typeSuggestions = suggestions.filter(s => s.meal_type === mealType);
                const emoji = mealType === 'breakfast' ? '🌅' : mealType === 'lunch' ? '☀️' : mealType === 'dinner' ? '🌆' : '🍪';
                return (
                  <div key={mealType} className="eh-card">
                    <h4 style={{ fontSize: 16, fontWeight: 600, color: '#ffffff', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {emoji} {mealType.charAt(0).toUpperCase() + mealType.slice(1)} Suggestions
                    </h4>
                    {typeSuggestions.length === 0 ? (
                      <div className="eh-empty">
                        No {mealType} suggestions for this cuisine
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                        {typeSuggestions.map(s => (
                          <div
                            key={s.name}
                            onClick={() => {
                              // Switch to log tab and pre-fill this meal
                              setActiveTab('log');
                              setForm(p => ({ ...p, meal_type: mealType, cuisine: s.cuisine as MealLog['cuisine'] }));
                              setFoodItems([{
                                name: s.name, portion: '1 serving',
                                calories: s.calories, protein_g: s.protein_g,
                                carbs_g: s.carbs_g, fat_g: s.fat_g, sodium_mg: s.sodium_mg,
                              }]);
                            }}
                            style={{
                              backgroundColor: '#0f0f23',
                              borderRadius: 10,
                              padding: '14px 16px',
                              cursor: 'pointer',
                              border: '1px solid #2a2a4e',
                              transition: 'border-color 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = '#3b82f6')}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2a4e')}
                          >
                            <div style={{ fontWeight: 600, color: '#ffffff', fontSize: 13, marginBottom: 6 }}>{s.name}</div>
                            <div className="eh-flex-wrap" style={{ fontSize: 11, color: '#94a3b8', gap: 16 }}>
                              <span>🔥 {s.calories} kcal</span>
                              <span>🥩 {s.protein_g}g</span>
                              <span>🍚 {s.carbs_g}g</span>
                              <span>🧈 {s.fat_g}g</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Today's Meals */}
        {data?.recent_logs && data.recent_logs.length > 0 && (
          <div className="eh-card" style={{ marginTop: 24 }}>
            <h3 className="eh-section-title">
              🍽️ Today&apos;s Meals
            </h3>
            <div style={{ display: 'grid', gap: 10 }}>
              {data.recent_logs.map(log => (
                <div key={log.id} style={{
                  backgroundColor: '#0f0f23', borderRadius: 10, padding: '14px 18px',
                  display: 'flex', alignItems: 'center', gap: 16,
                  border: '1px solid #2a2a4e',
                }}>
                  <span style={{ fontSize: 20 }}>
                    {log.meal_type === 'breakfast' ? '🌅' : log.meal_type === 'lunch' ? '☀️' : log.meal_type === 'dinner' ? '🌆' : '🍪'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#ffffff', fontSize: 13 }}>{log.foods.map(f => f.name).join(', ')}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                      {log.meal_type} · {log.total_calories} kcal · {log.total_protein_g}g protein · {log.total_sodium_mg}mg sodium
                    </div>
                    {log.notes && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4, fontStyle: 'italic' }}>{log.notes}</div>}
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'capitalize' }}>{log.cuisine}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Medical Disclaimer */}
        <div style={{
          textAlign: 'center',
          padding: '12px 16px',
          marginTop: 8,
          marginBottom: 8,
        }}>
          <p style={{
            color: '#6b7280',
            fontSize: 'clamp(10px, 1.5vw, 11px)',
            lineHeight: 1.5,
            margin: 0,
          }}>
            Always consult with a qualified healthcare provider before making any health decisions based on this information.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
