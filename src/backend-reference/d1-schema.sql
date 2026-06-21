-- Grow App authoritative premium wallet.
-- Apply once: wrangler d1 execute growapp-db --file=./d1-schema.sql

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS wallets (
  user_id TEXT PRIMARY KEY,
  premium_balance INTEGER NOT NULL DEFAULT 0 CHECK (premium_balance >= 0),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wallet_ledger (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  delta INTEGER NOT NULL CHECK (delta != 0),
  reason TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS wallet_ledger_user_created_idx
  ON wallet_ledger (user_id, created_at DESC);

-- Reject a debit before it can make the wallet negative.
CREATE TRIGGER IF NOT EXISTS wallet_ledger_guard_negative
BEFORE INSERT ON wallet_ledger
WHEN NEW.delta < 0
  AND NOT EXISTS (SELECT 1 FROM wallet_ledger WHERE id = NEW.id)
  AND COALESCE(
    (SELECT premium_balance FROM wallets WHERE user_id = NEW.user_id),
    0
  ) + NEW.delta < 0
BEGIN
  SELECT RAISE(ABORT, 'INSUFFICIENT_FUNDS');
END;

-- Every unique ledger row changes the wallet exactly once.
-- ON CONFLICT(id) DO NOTHING + PRIMARY KEY makes retries idempotent.
CREATE TRIGGER IF NOT EXISTS wallet_ledger_apply_credit
AFTER INSERT ON wallet_ledger
WHEN NEW.delta > 0
BEGIN
  INSERT INTO wallets (user_id, premium_balance, updated_at)
  VALUES (NEW.user_id, NEW.delta, CURRENT_TIMESTAMP)
  ON CONFLICT(user_id) DO UPDATE SET
    premium_balance = premium_balance + NEW.delta,
    updated_at = CURRENT_TIMESTAMP;
END;

CREATE TRIGGER IF NOT EXISTS wallet_ledger_apply_debit
AFTER INSERT ON wallet_ledger
WHEN NEW.delta < 0
BEGIN
  UPDATE wallets
  SET premium_balance = premium_balance + NEW.delta,
      updated_at = CURRENT_TIMESTAMP
  WHERE user_id = NEW.user_id;
END;
