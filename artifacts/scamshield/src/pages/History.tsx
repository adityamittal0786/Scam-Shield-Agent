import { useGetAnalysisHistory } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { History as HistoryIcon, Search } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function History() {
  const { data: history, isLoading } = useGetAnalysisHistory();

  const getRiskBadge = (level: string) => {
    switch (level) {
      case "Low":
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 uppercase font-mono text-[10px]">Low</Badge>;
      case "Medium":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 uppercase font-mono text-[10px]">Medium</Badge>;
      case "High":
        return <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20 uppercase font-mono text-[10px]">High</Badge>;
      case "Critical":
        return <Badge variant="destructive" className="bg-red-500/20 text-red-500 border-red-500/30 uppercase font-mono text-[10px]">Critical</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-foreground flex items-center gap-3">
          <HistoryIcon className="w-8 h-8 text-primary" />
          Analysis History
        </h1>
        <p className="text-muted-foreground text-lg">
          A log of recently analyzed threats across the network.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Scans</CardTitle>
          <CardDescription>The 50 most recent messages analyzed by ScamShield.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-12 opacity-50">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : history && history.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[100px] font-mono">Risk</TableHead>
                    <TableHead className="w-[150px] font-mono">Type</TableHead>
                    <TableHead className="font-mono">Content Snippet</TableHead>
                    <TableHead className="w-[120px] text-right font-mono">Analyzed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{getRiskBadge(record.riskLevel)}</TableCell>
                      <TableCell className="font-medium text-xs text-primary">{record.scamType}</TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground font-mono text-xs">
                        {record.contentSnippet}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(record.analyzedAt), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center p-12 border border-dashed rounded-lg bg-muted/20">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium">No history found</h3>
              <p className="text-muted-foreground mt-2 mb-6">You haven't analyzed any messages yet.</p>
              <Link href="/">
                <Button>Analyze a Message</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}