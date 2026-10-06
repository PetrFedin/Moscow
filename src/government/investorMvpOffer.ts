export type InvestorMvpPaymentLayer = {
  id: string;
  title: string;
  paysFor: string;
  acceptedBy: string;
};

export const investorMvpOffer = {
  title: 'Москва · туристический цифровой слой',
  subtitle:
    'Один продукт связывает план поездки, билеты и брони, городской контент, проверенную историю, фактическое посещение и операторскую аналитику.',
  thesis:
    'Москва покупает не “ещё одно приложение”, а управляемый слой туристического пути: traveler experience + verified heritage + integrations + city operations + evidence.',
  travelerPath: [
    'Собрать поездку по дням: обязательные билеты, брони, места и свободные окна.',
    'Получать единый план дня без подмены provider truth: ручные данные остаются пользовательскими, подтверждённые — provider-confirmed.',
    'Во время прогулки получать исторический слой, аудио, 3D/AR там, где объект прошёл соответствующие gates.',
    'При изменении дня пересобрать свободную часть маршрута, не ломая фиксированные билеты и брони.',
    'После посещения сохранить личную историю Москвы: где был, что видел, где ел, какие места и темы стоит продолжить.'
  ],
  cityDeliverables: [
    {
      title: 'Публичный туристический клиент',
      body:
        'iOS / Android / web reference client: поездка по дням, Today, билеты и брони, маршрут, история, offline-safe content и “Моя Москва”.'
    },
    {
      title: 'Пакет района',
      body:
        'Versioned destination package: точки, маршруты, локализации, verified heritage objects, provider links и publication state.'
    },
    {
      title: 'City Heritage Studio',
      body:
        'Рабочий процесс source → rights → historical claim → model/media → review → publish, чтобы цифровой объект не зависел от одного подрядчика.'
    },
    {
      title: 'City Journey Control Center',
      body:
        'Операторский слой для состояния маршрутов, provider freshness, evidence, acceptance и проблем, требующих вмешательства.'
    },
    {
      title: 'Интеграционные контракты',
      body:
        'API / deep-link / feed boundaries для RUSSPASS и других согласованных городских или коммерческих провайдеров без создания параллельной OTA.'
    },
    {
      title: 'Доказательный пакет пилота',
      body:
        'Field evidence, supervised visitor pilot, aggregate analytics, acceptance matrix, production economics и Go / No-Go memo для следующего этапа.'
    }
  ],
  pilotScope: [
    'Территория: Варварка — Зарядье.',
    '5 точек маршрута и 2 spatial hero objects: Палаты Романовых + Старый Английский двор.',
    'Рабочий traveler flow: план дня → маршрут → исторический experience → фиксация посещения.',
    '20–50 supervised pilot sessions с aggregate-only отчётом.',
    'Один согласованный live/provider integration contour или формально зафиксированный integration handoff.',
    'Измерение фактической стоимости, lead time и трудозатрат следующего verified object.'
  ],
  acceptance: [
    'Пользовательский путь работает на заявленных целевых клиентах и не показывает demo/live данные как реальные.',
    'Romanov проходит реальный physical field proof.',
    'Old English Court подтверждает повторяемость pipeline на втором независимом объекте.',
    'Visitor pilot завершён реальными сессиями и формальным итоговым отчётом.',
    'Provider / integration truth отделена от пользовательских ручных данных и имеет freshness / evidence boundary.',
    'Город получает формальный handover: код/контракты/документация/права/операционная модель в согласованном объёме.'
  ],
  paymentLayers: [
    {
      id: 'pilot',
      title: '1 · Доказательный пилот',
      paysFor:
        'Ограниченный scope Варварки, production двух hero objects, полевой proof, user pilot, интеграционный контур и итоговый evidence pack.',
      acceptedBy:
        'Согласованная матрица критериев пилота. Сам статус пилота не равен автоматическому масштабированию.'
    },
    {
      id: 'platform',
      title: '2 · Платформа и эксплуатация',
      paysFor:
        'После успешного пилота: лицензирование/эксплуатация client + Studio + Control Center, hosting, monitoring, support и обновления.',
      acceptedBy:
        'SLA, security/data-flow, release governance и эксплуатационные KPI.'
    },
    {
      id: 'district',
      title: '3 · Новый район / destination pack',
      paysFor:
        'Shared setup района + интеграция + производство и верификация согласованного количества объектов и маршрутов.',
      acceptedBy:
        'Published destination package, прошедшие gates объекты и формальная приёмка контента/прав/интеграций.'
    },
    {
      id: 'integration',
      title: '4 · Интеграции и развитие',
      paysFor:
        'Новые provider adapters, городские data contracts, новые сценарии и change requests, которые не входят в базовый scope.',
      acceptedBy:
        'Конкретный API/data contract, тестовый evidence и agreed acceptance для каждой интеграции.'
    }
  ] as InvestorMvpPaymentLayer[],
  scaleFormula: [
    'Pilot = fixed scope + agreed acceptance.',
    'District delivery = shared setup + integration + N × measured verified-object cost.',
    'Run = annual platform / operations + provider maintenance.',
    'Никакой “федеральной цены” и ROI не заявляем до реальных Moscow proof и measured economics.'
  ],
  notInMvp: [
    'Не строим отдельную OTA и собственный платёжный контур.',
    'Не дублируем RUSSPASS / городские каталоги, если есть authoritative integration route.',
    'Не масштабируем city-wide 3D до field proof и repeatability.',
    'Не продаём social network, sponsorship marketplace или “метавселенную Москвы” в первом контракте.',
    'Не показываем недоказанные live availability, исторические реконструкции или field accuracy как факт.',
    'Не продаём федеральное масштабирование до доказанного Moscow reference и первого внешнего региона.'
  ],
  firstDecision:
    'Согласовать профильного owner задачи, пилотную площадку, integration/data owner и рабочую сессию по scope + acceptance + правовой форме пилота.'
} as const;
