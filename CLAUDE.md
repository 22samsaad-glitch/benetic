# Benetic WAT Framework

## Project Overview
This project uses the WAT (Workflows, Agents, Tools) architecture to build reliable, AI-assisted workflows for Benetic.

## Architecture
- **workflows/** — Markdown SOPs. Each file defines an objective, required inputs, tools to use, expected outputs, and edge case handling.
- **tools/** — Python scripts for deterministic execution (API calls, data transforms, file ops).
- **.tmp/** — Scratch space for intermediate files. Disposable and regenerated as needed.
- **.env** — API keys and secrets. Never committed.

## How I Should Operate
1. When given a task, check `workflows/` for an existing SOP first.
2. Check `tools/` for existing scripts before building anything new.
3. Run tools via `python tools/<script>.py` with appropriate arguments.
4. When something fails: fix the tool, verify it works, then update the workflow.
5. Final deliverables go to cloud services (Google Sheets, Slides, etc.) — not just local files.

## Python Environment
- Use `python3` for all scripts.
- Install dependencies with `pip install <package>` as needed.
- Load env vars with `python-dotenv`: `from dotenv import load_dotenv; load_dotenv()`

## Conventions
- Tool scripts should accept CLI args and print clear success/error messages.
- Workflow files should stay up to date as we learn — update them when we discover constraints or better methods.
- Keep `.tmp/` clean; it's for processing only.
