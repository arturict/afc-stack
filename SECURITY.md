# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please:

1. **DO NOT** open a public issue
2. Email security concerns to: your-email@example.com
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work with you to address the issue.

## Security Best Practices

When using this template:

1. **Never commit secrets** to version control
2. Use **strong, unique values** for `NEXTAUTH_SECRET`
3. Keep **dependencies updated** regularly
4. Use **environment variables** for sensitive data
5. Enable **database backups** in production
6. Use **HTTPS/WSS** in production
7. Configure **CORS** properly
8. Enable **rate limiting** (Arcjet)
9. Review **OAuth redirect URLs** carefully
10. Use **least privilege** for database users

## Dependency Security

This template uses:
- Automated dependency updates (Dependabot recommended)
- Known vulnerability scanning
- Minimal dependency footprint

Run `bun audit` regularly to check for vulnerabilities.
