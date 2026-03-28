# Contexto Arquitetural do Projeto F!re (Frontend)

## Stack Tecnológica
- **Framework:** Next.js 14+ (App Router).
- **Linguagem:** TypeScript (Strict Mode).
- **Estilização:** TailwindCSS v4.
- **Componentes UI:** Shadcn/ui (Radix UI) pré-configurados.

## Arquitetura: Atomic Design Rigoroso
- **Atoms (`src/components/atoms`):** Componentes base (Botões, Badges, Typography, Inputs) que aplicam as variantes visuais do Design System (CVA) sobre os componentes funcionais do `src/components/ui`.
- **Molecules (`src/components/molecules`):** Combinação de Atoms sem lógica de negócio complexa (ex: `InfoCard` combinando ícone, título e descrição).
- **Organisms (`src/components/organisms`):** Seções completas da página (Hero, Header, RaceInfo, HistoryGallery) que compõem molecules e atoms e gerenciam dados (mocks).

## Design System (tokens)
- **Cores:**
  - `primary`: `#F25D27` (Laranja Principal)
  - `secondary`: `#D97855` (Terracota)
  - `accent`: `#F2B6A0` (Destaque Claro)
  - `destructive`: `#F24E29` (Laranja Vibrante)
  - `background`: `#F2F2F2` (Cinza Claro)
- **Tipografia:** Montserrat (Headings) e Inter (Body).

## Diretrizes de Implementação
- **Responsividade:** Mobile-First obrigatório. Teste em 320px, 768px, 1024px e 1440px.
- **SSR & Hydration:** Componentes Client que utilizam datas (ex: Countdown) devem usar o hook `useEffect` com estado `isMounted` para evitar erros de hidratação.
- **Mocks:** Consumir dados estáticos exclusivamente de `src/mocks/`.
- **Linguagem:** Todo o código visível ao usuário (textos, placeholders) e nomes de variáveis/componentes devem ser em Português. Technical terms are allowed in comments.
