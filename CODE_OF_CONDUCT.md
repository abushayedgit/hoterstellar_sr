# Code of Conduct

This is a small, private project (`abushayedgit/hoterstellar_sr`) maintained by a small team. This document is intentionally short — it sets baseline expectations for anyone with repository access (owner, contributors, and anyone granted access in the future).

## Expectations

- **Be direct and respectful in reviews.** Critique the code, not the person. "This will break under concurrent requests because X" is useful; dismissive comments aren't.
- **Assume good faith.** Most bugs are mistakes, not carelessness. Most disagreements are about trade-offs, not competence.
- **Keep discussion in the right place.** Technical disagreements belong in PR/issue comments so there's a record; security vulnerabilities belong in a private channel (see `SECURITY.md`) — never in a public issue.
- **Don't commit or share secrets.** Treat `.env` values, JWT secrets, database URIs, and third-party API keys (Brevo, ImageKit, Upstash, reCAPTCHA) as confidential at all times, including in screenshots, chat messages, and commit messages.
- **Respect customer and user data.** This system stores real customer information (names, emails, phone numbers, addresses, order history). Never access, export, or share user data outside of what's needed to do the task at hand — this applies to production data especially.

## Unacceptable Behavior

- Harassment, personal attacks, or discriminatory language directed at anyone with access to this project.
- Deliberately introducing insecure code, backdoors, or bypassing the auth/authorization layers described in `README.md` and `SECURITY.md`.
- Accessing or modifying production data, admin accounts, or another person's account without a legitimate, work-related reason.
- Publicly disclosing a security vulnerability before it's been privately reported and addressed (see `SECURITY.md`).

## Enforcement

Since this is a small, closed-access repository, enforcement is handled directly by the repository owner, **[@abushayedgit](https://github.com/abushayedgit)**. Concerns can be raised with them directly. Access to the repository can be revoked at the owner's discretion for violations of the above.

## Scope

This applies to all interaction within this repository — issues, pull requests, code review comments, commit messages — and to any other channel (chat, email, calls) used to discuss this project.
