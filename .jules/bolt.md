## 2026-02-16 - Parallelizing Independent DB Queries
**Learning:** Sequential await calls for independent database queries in controllers are a significant performance bottleneck (e.g., dashboard stats). The mysql2 driver handles parallel queries efficiently via connection pooling.
**Action:** Always check controllers for sequential await calls that don't depend on each other and convert them to Promise.all.
