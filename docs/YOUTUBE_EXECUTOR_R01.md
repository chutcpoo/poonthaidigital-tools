# Poonthai Focus YouTube Executor R01

Safety-first scaffold for YouTube publishing.

- Default: `YOUTUBE_WRITES_ENABLED=false`
- Only accepted operation: `private_upload`
- Only accepted privacy: `private`
- GET reports readiness without exposing secrets.
- POST in disabled mode returns `DRY_RUN_PASS` and `youtubeWriteCount: 0`.
- R01 deliberately does not execute YouTube writes until OAuth credentials/token are configured and the protected-state write implementation receives a separate authorization.

Required env names (values must never be committed):
- YOUTUBE_CLIENT_ID
- YOUTUBE_CLIENT_SECRET
- YOUTUBE_REFRESH_TOKEN
- YOUTUBE_WRITES_ENABLED=false

T03 canonical Drive IDs currently intended for the later protected upload:
- videoFileId: 1IaDHplfqUxouhvpsZJV5FDcFLZczpl4o
- thumbnailFileId: 1GHFuKmOvFOg7ThBXyNvKxxQC2KCPspom

No public upload is supported by this endpoint.
