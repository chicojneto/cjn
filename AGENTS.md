# Architecture rules

- Keep the primary navigation focused on Manhã, Mercados, Notícias, and Referência; the sessions dashboard remains accessible from the home logo because it is the home page.
- Keep Curva DI editing in Configurações and its analytical consumers outside Mercados; this avoids duplicating the manual editor in market data views.
- Run automatic news ingestion only from the server with a database lease, bounded sequential AI calls, and persistent pause state; this prevents duplicate or runaway billed work.