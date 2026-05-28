export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-20">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Nirmata
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Sua consciência coletiva de 12 agentes IA
          </p>
        </div>

        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
          12 agentes especializados pensando em grupo pra orientar você em decisões complexas.
        </p>

        <div className="grid grid-cols-2 gap-4 py-8">
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <p className="text-3xl mb-2">📊</p>
            <p className="font-semibold">Análise</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Dados, Tech, Finanças</p>
          </div>
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <p className="text-3xl mb-2">🎯</p>
            <p className="font-semibold">Estratégia</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Visão, Produto, Criatividade</p>
          </div>
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <p className="text-3xl mb-2">⚖️</p>
            <p className="font-semibold">Risco</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Segurança, Compliance</p>
          </div>
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <p className="text-3xl mb-2">🤝</p>
            <p className="font-semibold">Pessoas</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Comunicação, Cultura</p>
          </div>
        </div>

        <div className="space-y-4">
          
            href="/mente"
            className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Entrar no Nirmata
          </a>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Requer autenticação com email @seazone.com.br
          </p>
        </div>
      </div>
    </main>
  )
}
