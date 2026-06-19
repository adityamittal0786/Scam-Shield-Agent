import { useGetScamStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3, ShieldAlert, Target, ShieldCheck } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

export default function Stats() {
  const { data: stats, isLoading } = useGetScamStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center p-12">
        <h3 className="text-lg font-medium text-destructive">Failed to load statistics</h3>
      </div>
    );
  }

  // Format data for charts
  const riskData = Object.entries(stats.byRiskLevel).map(([name, value]) => ({
    name, value
  }));

  const typeData = Object.entries(stats.byType)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // top 5

  const COLORS = {
    Low: "hsl(142 71% 45%)",
    Medium: "hsl(38 92% 50%)",
    High: "hsl(24.6 95% 53.1%)",
    Critical: "hsl(0 84% 60%)"
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-foreground flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-primary" />
          Threat Intelligence
        </h1>
        <p className="text-muted-foreground text-lg">
          Global statistics on analyzed threats and scam patterns.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider font-mono">Total Analyzed</CardTitle>
            <ShieldCheck className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-mono">{stats.totalAnalyzed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">messages scanned</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider font-mono">Critical Threats</CardTitle>
            <ShieldAlert className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-mono text-destructive">
              {stats.byRiskLevel["Critical"] || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">high-severity scams blocked</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider font-mono">Avg Confidence</CardTitle>
            <Target className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-mono text-primary">
              {Math.round(stats.averageConfidence)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">AI detection accuracy</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
            <CardDescription>Breakdown of analyzed messages by severity level.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {stats.totalAnalyzed === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || "hsl(var(--primary))"} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Threat Vectors</CardTitle>
            <CardDescription>Most frequently detected scam methodologies.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {stats.totalAnalyzed === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis dataKey="name" type="category" width={100} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <Tooltip 
                    cursor={{fill: 'hsl(var(--muted))'}}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}