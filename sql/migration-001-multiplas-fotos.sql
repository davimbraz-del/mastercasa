-- ==========================================================================
-- Migração: suporte a múltiplas fotos por imóvel
-- Cole no SQL Editor do Supabase e rode (só precisa rodar uma vez).
-- ==========================================================================

alter table public.properties add column if not exists photos text[];
