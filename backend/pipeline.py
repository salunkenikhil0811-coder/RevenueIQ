"""End-to-end pipeline: generate demo data -> train model -> score -> create cards."""
import argparse
import time

from . import db
from .generate_data import generate
from .model import score, train


is_ready = db.is_ready


def run_all(log=print, seed=42):
    t0 = time.time()
    conn = db.connect()
    try:
        db.init_schema(conn)
        log("Generating synthetic SaaS data (2 years of history)...")
        stats = generate(conn, seed=seed)
        log(f"  {stats['accounts']:,} accounts, {stats['usage_rows']:,} usage weeks, "
            f"{stats['tickets']:,} tickets")
        train(conn, log=log)
        score(conn, log=log)
    finally:
        conn.close()
    log(f"Done in {time.time() - t0:.0f}s.")


def retrain(log=print):
    conn = db.connect()
    try:
        train(conn, log=log)
        score(conn, log=log)
    finally:
        conn.close()


def rescore(log=print):
    conn = db.connect()
    try:
        score(conn, log=log)
    finally:
        conn.close()


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--if-missing", action="store_true", help="only build when no data/model exists")
    args = ap.parse_args()
    if args.if_missing and is_ready():
        print("Data and model already exist.")
    else:
        run_all()
