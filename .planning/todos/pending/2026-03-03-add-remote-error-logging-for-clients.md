---
created: 2026-03-03T15:24:46
title: Add remote error logging for clients
area: general
files: []
---

## Problem

Need to view errors remotely from client applications to monitor issues without direct access to devices. Currently unable to diagnose problems that occur on client devices.

## Solution

Consider using Sentry for error tracking and monitoring. Sentry provides:
- Real-time error tracking
- Stack traces and context
- Breadcrumbs for debugging
- Performance monitoring
- Optional: self-hosted vs cloud solution

Alternative options to evaluate:
- LogRocket
- Datadog RUM
- Custom solution with API endpoint

TBD: Implementation details and integration approach
