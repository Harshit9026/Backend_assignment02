# 📈 TaskFlow — Scalability Architecture Note

## Current Architecture
The current implementation is a monolithic Node.js/Express API with MongoDB, designed with scalability as a first-class concern from day one. The following describes how this system evolves from MVP to planet-scale.

---

## Phase 1: Vertical Scaling + Connection Optimization (Current)

The current codebase already implements several scalability primitives:

### Database Connection Pooling
```js
// database.js
mongoose.connect(uri, {
  maxPoolSize: 10,        // 10 concurrent DB connections per instance
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
```
This prevents connection exhaustion under load. Increasing `maxPoolSize` allows more parallelism without spawning new processes.

### Strategic Database Indexes
```js
// task.schema indexes
taskSchema.index({ owner: 1, status: 1 });       // Filter tasks by owner+status
taskSchema.index({ owner: 1, priority: 1 });      // Sort by priority
taskSchema.index({ title: 'text', description: 'text' }); // Full-text search
```
Without indexes, MongoDB performs full collection scans — O(n). With compound indexes, queries are O(log n), critical as data grows to millions of records.

### Stateless JWT Architecture
All authentication state is encoded in the JWT token itself. This means **any instance of the API** can verify any user's token without consulting shared state. This is the foundation for horizontal scaling.

---

## Phase 2: Horizontal Scaling

### Load Balancing
Deploy multiple API instances behind a load balancer (NGINX, AWS ALB, or Cloudflare):

```
              ┌─── API Instance 1 (Node.js)
Client ──► LB ┼─── API Instance 2 (Node.js)  ──► MongoDB Atlas
              └─── API Instance 3 (Node.js)
```

Because JWT is stateless, any instance handles any request — no sticky sessions needed.

**NGINX Config:**
```nginx
upstream taskflow_backend {
    least_conn;
    server api1:5000;
    server api2:5000;
    server api3:5000;
}
```

### Container Orchestration (Kubernetes)
```yaml
# Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec:
  minReplicas: 2
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          averageUtilization: 70
```
Kubernetes automatically adds/removes API pods based on CPU/memory load, handling traffic spikes without manual intervention.

---

## Phase 3: Caching Layer (Redis)

The `.env.example` already includes `REDIS_URL`. Here's how caching would be integrated:

### Cache Frequently Accessed Data
```js
// Cache user task stats (invalidate on task mutation)
const getTaskStats = async (userId) => {
  const cacheKey = `stats:${userId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const stats = await Task.aggregate([...]);
  await redis.setex(cacheKey, 300, JSON.stringify(stats)); // 5 min TTL
  return stats;
};
```

### Cache Admin Queries
Platform-wide stats (`/admin/stats`) are expensive aggregations. Caching with a 60-second TTL reduces DB load by ~95% for busy admin dashboards.

### Session/Refresh Token Storage
Move refresh tokens from MongoDB to Redis for sub-millisecond token lookups:
```js
// O(1) Redis lookup vs O(log n) MongoDB query
await redis.setex(`refresh:${userId}`, 30 * 24 * 3600, refreshToken);
```

**Cache Strategy:**
- Task stats: TTL 5 minutes, invalidate on task CUD
- User profile: TTL 10 minutes, invalidate on profile update
- Admin stats: TTL 60 seconds (acceptable staleness)

---

## Phase 4: Microservices Architecture

As the team and codebase grow, split the monolith into independent services:

```
                         ┌─── Auth Service      (Node.js + Redis)
API Gateway (Kong) ──►  ├─── Task Service       (Node.js + MongoDB)
                         ├─── User Service       (Node.js + PostgreSQL)
                         ├─── Notification Svc   (Node.js + Bull Queue)
                         └─── Admin Service      (Node.js + MongoDB)
```

**Benefits:**
- Independent deployments — deploy Auth Service without touching Task Service
- Independent scaling — Task Service handles 10x more traffic than Admin Service
- Technology diversity — Choose the best DB for each service
- Fault isolation — Auth Service failure doesn't bring down Task Service

**Communication Patterns:**
- Synchronous: HTTP/gRPC for real-time queries
- Asynchronous: RabbitMQ/Kafka for events (task completed → send email notification)

The current codebase's modular structure (controllers/models/routes per domain) maps directly to microservice boundaries.

---

## Phase 5: Global Distribution (CDN + Multi-Region)

```
Users (India)    ──► Mumbai Region   ──► MongoDB Asia
Users (Europe)   ──► Frankfurt Region ──► MongoDB EU
Users (US)       ──► Virginia Region  ──► MongoDB US Primary
```

**MongoDB Atlas Global Clusters** provide automatic cross-region replication. Write to primary, read from nearest replica — dramatically reducing latency for global users.

**CloudFront/Fastly CDN** serves the React frontend from 200+ edge locations worldwide.

---

## Phase 6: Event-Driven Architecture

For features like "notify user when task deadline approaches":

```js
// Publish event to message queue
await kafka.produce('task.deadline.approaching', {
  userId: task.owner,
  taskId: task._id,
  dueDate: task.dueDate,
});

// Separate notification service consumes
kafka.consume('task.deadline.approaching', async (msg) => {
  await emailService.send(msg.userId, 'Your task is due soon!');
  await pushNotification.send(msg.userId, 'Task reminder');
});
```

**Queue-based processing** decouples the API from slow operations (email, PDF generation, webhooks), keeping API response times under 100ms.

---

## Scalability Checklist Summary

| Layer | Current | Phase 2 | Phase 3 | Phase 4+ |
|-------|---------|---------|---------|----------|
| API | Single instance | Horizontal LB | Auto-scaling K8s | Microservices |
| Auth | JWT stateless | Same | Redis sessions | Auth Service |
| Database | MongoDB single | Atlas replica set | Read replicas | Sharding |
| Cache | None | None | Redis | Redis Cluster |
| Queue | None | None | Bull.js | Kafka/RabbitMQ |
| CDN | None | CloudFront | CloudFront | Multi-region |
| Monitoring | Winston logs | Datadog/Grafana | Full APM | Distributed tracing |

---

## Performance Benchmarks (Estimates)

| Configuration | Requests/sec | P99 Latency |
|--------------|-------------|-------------|
| Single instance (current) | ~1,000 req/s | <50ms |
| 3 instances + LB | ~3,000 req/s | <50ms |
| 10 instances + Redis cache | ~15,000 req/s | <20ms |
| Microservices + Kafka | ~100,000+ req/s | <10ms |

The foundation is solid. Scale it when the metrics demand it — premature optimization is the root of all evil, but the architecture is ready.
