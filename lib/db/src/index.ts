import * as schema from "./schema";
import { analysesTable } from "./schema";

// In-memory storage for development without database
const inMemoryStorage: any[] = [];

// Track which column is being grouped for proper aggregation
let currentGroupColumn: string | null = null;

// Mock db interface for in-memory storage
export const db = {
  insert: (table: any) => ({
    values: (data: any) => {
      const record = {
        id: inMemoryStorage.length + 1,
        ...data,
        analyzedAt: new Date(),
      };
      inMemoryStorage.push(record);
      return Promise.resolve([record]);
    }
  }),
  select: (columns: any) => {
    let hasGroupBy = false;
    let groupColumn: string | null = null;
    let hasOrderBy = false;
    let orderByColumn: any = null;
    let limitValue: number | null = null;
    let whereCondition: any = null;

    // Execute the query
    const execute = async () => {
      if (hasGroupBy) {
        // Handle stats aggregation based on group column
        if (groupColumn === 'risk_level' || groupColumn === 'riskLevel') {
          const riskLevelCounts: Record<string, number> = {};
          inMemoryStorage.forEach((record: any) => {
            const risk = record.riskLevel || 'Unknown';
            riskLevelCounts[risk] = (riskLevelCounts[risk] || 0) + 1;
          });
          
          const result = Object.entries(riskLevelCounts).map(([riskLevel, count]) => ({
            riskLevel,
            count
          }));
          
          return result;
        } else if (groupColumn === 'scam_type' || groupColumn === 'scamType') {
          const typeCounts: Record<string, number> = {};
          inMemoryStorage.forEach((record: any) => {
            const type = record.scamType || 'Unknown';
            typeCounts[type] = (typeCounts[type] || 0) + 1;
          });
          
          let result = Object.entries(typeCounts).map(([scamType, count]) => ({
            scamType,
            count
          }));
          
          result.sort((a, b) => b.count - a.count);
          if (limitValue) result = result.slice(0, limitValue);
          
          return result;
        } else {
          return [];
        }
      } else {
        // Regular select - handle count/avg queries
        if (columns && typeof columns === 'object' && 'count' in columns) {
          // This is a count(*) query
          return [{ count: inMemoryStorage.length }];
        } else if (columns && typeof columns === 'object' && 'avg' in columns) {
          // This is an avg query
          if (inMemoryStorage.length === 0) {
            return [{ avg: 0 }];
          } else {
            const sum = inMemoryStorage.reduce((acc: number, record: any) => acc + (record.confidenceScore || 0), 0);
            return [{ avg: sum / inMemoryStorage.length }];
          }
        } else {
          // Regular select
          let result = [...inMemoryStorage];
          if (whereCondition) {
            result = result.filter((record: any) => {
              if (whereCondition.sid) return record.sid === whereCondition.sid;
              return true;
            });
          }
          result.sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime());
          if (limitValue) result = result.slice(0, limitValue);
          return result;
        }
      }
    };

    const chain = {
      from: (table: any) => chain,
      orderBy: (order: any) => {
        hasOrderBy = true;
        orderByColumn = order;
        return chain;
      },
      groupBy: (column: any) => {
        hasGroupBy = true;
        // Extract column name if it's a PgColumn object
        groupColumn = typeof column === 'object' && column !== null ? column.name : column;
        return chain;
      },
      limit: (limit: number) => {
        limitValue = limit;
        return chain;
      },
      where: (condition: any) => {
        whereCondition = condition;
        return chain;
      }
    };

    return {
      ...chain,
      then: (resolve: any, reject: any) => execute().then(resolve, reject)
    };
  },
  update: (table: any) => ({
    set: (data: any) => ({
      where: (condition: any) => ({
        then: async (resolve: any) => {
          // Simple mock for update - just return the data
          resolve([data]);
        }
      })
    })
  }),
  delete: (table: any) => ({
    where: (condition: any) => ({
      returning: (columns: any) => {
        const id = condition.id;
        const index = inMemoryStorage.findIndex((r: any) => r.id === id);
        if (index >= 0) {
          const deleted = inMemoryStorage.splice(index, 1);
          return Promise.resolve(deleted);
        } else {
          return Promise.resolve([]);
        }
      }
    })
  })
};

// Mock sql for aggregations
export const sql = {
  count: () => inMemoryStorage.length,
  avg: (column: string) => {
    if (column === 'confidence_score' || column === 'confidenceScore') {
      if (inMemoryStorage.length === 0) return 0;
      const sum = inMemoryStorage.reduce((acc: number, record: any) => acc + (record.confidenceScore || 0), 0);
      return sum / inMemoryStorage.length;
    }
    return 0;
  }
};

export * from "./schema";
