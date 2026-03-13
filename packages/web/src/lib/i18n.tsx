'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

/* ═══════════════════════════════════════════════════════
   Language type & dictionary
   ═══════════════════════════════════════════════════════ */

export type Lang = 'en' | 'ru';

const STORAGE_KEY = 'lol-lang';

function getInitialLang(): Lang {
  if (typeof window === 'undefined') return 'en';
  return (localStorage.getItem(STORAGE_KEY) as Lang) || 'en';
}

/* ═══════════════════════════════════════════════════════
   Translation dictionary
   ═══════════════════════════════════════════════════════ */

const dict: Record<string, Record<Lang, string>> = {
  /* ──── Navigation ──── */
  'nav.dashboard': { en: 'Dashboard', ru: 'Панель' },
  'nav.loads': { en: 'Loads', ru: 'Грузы' },
  'nav.statements': { en: 'Statements', ru: 'Отчёты' },
  'nav.salary': { en: 'Salary', ru: 'Зарплата' },
  'nav.settings': { en: 'Settings', ru: 'Настройки' },
  'nav.signOut': { en: 'Sign Out', ru: 'Выйти' },
  'nav.subtitle': { en: 'Transportation Management', ru: 'Управление перевозками' },

  /* ──── Login ──── */
  'login.title': { en: 'Sign in to your account', ru: 'Войдите в аккаунт' },
  'login.email': { en: 'Email', ru: 'Эл. почта' },
  'login.emailPlaceholder': { en: 'you@company.com', ru: 'вы@компания.com' },
  'login.password': { en: 'Password', ru: 'Пароль' },
  'login.passwordPlaceholder': { en: 'Enter your password', ru: 'Введите пароль' },
  'login.signingIn': { en: 'Signing in...', ru: 'Вход...' },
  'login.signIn': { en: 'Sign In', ru: 'Войти' },

  /* ──── Dashboard ──── */
  'dash.title': { en: 'Dashboard', ru: 'Панель управления' },
  'dash.subtitle': { en: 'Weekly profit overview and trends', ru: 'Обзор прибыли и тренды по неделям' },
  'dash.morning': { en: 'Good morning', ru: 'Доброе утро' },
  'dash.afternoon': { en: 'Good afternoon', ru: 'Добрый день' },
  'dash.evening': { en: 'Good evening', ru: 'Добрый вечер' },
  'dash.summary': { en: 'Here is your operational summary for the selected period.', ru: 'Операционная сводка за выбранный период.' },
  'dash.range': { en: 'Range:', ru: 'Период:' },
  'dash.last4': { en: 'Last 4 weeks', ru: 'Посл. 4 нед.' },
  'dash.last8': { en: 'Last 8 weeks', ru: 'Посл. 8 нед.' },
  'dash.last12': { en: 'Last 12 weeks', ru: 'Посл. 12 нед.' },
  'dash.allWeeks': { en: 'All weeks', ru: 'Все недели' },
  'dash.loading': { en: 'Loading dashboard...', ru: 'Загрузка панели...' },
  'dash.noData': { en: 'No data for this range', ru: 'Нет данных за этот период' },
  'dash.noDataHint': { en: 'Try selecting a wider range or create some loads first.', ru: 'Попробуйте выбрать больший период или создайте грузы.' },
  'dash.totalLoads': { en: 'Total Loads', ru: 'Всего грузов' },
  'dash.grossRevenue': { en: 'Gross Revenue', ru: 'Валовый доход' },
  'dash.netProfit': { en: 'Net Profit', ru: 'Чистая прибыль' },
  'dash.driverCost': { en: 'Driver Cost', ru: 'Расход на водителя' },
  'dash.avgGrossLoad': { en: 'Avg Gross / Load', ru: 'Сред. доход / Груз' },
  'dash.avgProfitLoad': { en: 'Avg Profit / Load', ru: 'Сред. прибыль / Груз' },
  'dash.avgMiles': { en: 'Avg Miles', ru: 'Сред. мили' },
  'dash.avgMargin': { en: 'Avg Margin', ru: 'Сред. маржа' },
  'dash.loadStatus': { en: 'Load Status', ru: 'Статус грузов' },
  'dash.distribution': { en: 'Distribution for the selected period', ru: 'Распределение за выбранный период' },

  /* ──── Charts ──── */
  'chart.revenueCostNet': { en: 'Revenue, Cost & Net Profit', ru: 'Доход, Расход и Чистая прибыль' },
  'chart.weeklyOverview': { en: 'Weekly money-flow overview', ru: 'Еженедельный обзор денежного потока' },
  'chart.profitability': { en: 'Profitability', ru: 'Прибыльность' },
  'chart.profitOtrWeek': { en: 'Profit & OTR by week, margin % trend', ru: 'Прибыль и OTR по неделям, тренд маржи %' },
  'chart.loadVolume': { en: 'Load Volume', ru: 'Объём грузов' },
  'chart.loadsDispatched': { en: 'Loads dispatched per week', ru: 'Грузы отправленные за неделю' },
  'chart.totalLoadsDispatched': { en: '{count} total loads dispatched', ru: 'Всего отправлено {count} грузов' },
  'chart.topCorridors': { en: 'Top Corridors', ru: 'Топ маршруты' },
  'chart.paymentFlags': { en: 'Payment Flags', ru: 'Флаги оплаты' },
  'chart.noFlagsSet': { en: 'No payment flags set on loads in this period.', ru: 'Флаги оплаты не установлены в этом периоде.' },
  'chart.grossRevenue': { en: 'Gross Revenue', ru: 'Валовый доход' },
  'chart.driverCost': { en: 'Driver Cost', ru: 'Расход на водителя' },
  'chart.netProfit': { en: 'Net Profit', ru: 'Чистая прибыль' },
  'chart.profit': { en: 'Profit', ru: 'Прибыль' },
  'chart.otr': { en: 'OTR (1.25%)', ru: 'OTR (1.25%)' },
  'chart.margin': { en: 'Margin', ru: 'Маржа' },
  'chart.marginPct': { en: 'Margin %', ru: 'Маржа %' },
  'chart.loads': { en: 'Loads', ru: 'Грузы' },
  'chart.lolCount': { en: 'LOL Count', ru: 'Кол-во LOL' },
  'chart.avgGrossLoad': { en: 'Avg Gross/Load', ru: 'Сред. доход/Груз' },
  'chart.configure': { en: 'Configure', ru: 'Настроить' },
  'chart.columns': { en: 'Columns', ru: 'Столбцы' },

  /* ──── Chart column keys ──── */
  'col.gross': { en: 'Gross Revenue', ru: 'Валовый доход' },
  'col.driver': { en: 'Driver Cost', ru: 'Расход на водителя' },
  'col.profit': { en: 'Profit', ru: 'Прибыль' },
  'col.otr': { en: 'OTR (1.25%)', ru: 'OTR (1.25%)' },
  'col.net': { en: 'Net Profit', ru: 'Чистая прибыль' },

  /* ──── Status labels ──── */
  'status.not_picked_up': { en: 'Not Picked Up', ru: 'Не забран' },
  'status.in_transit': { en: 'In Transit', ru: 'В пути' },
  'status.delivered': { en: 'Delivered', ru: 'Доставлен' },
  'status.completed': { en: 'Completed', ru: 'Завершён' },
  'status.cancelled': { en: 'Cancelled', ru: 'Отменён' },

  /* ──── Top Corridors table ──── */
  'corridors.route': { en: 'Route', ru: 'Маршрут' },
  'corridors.loads': { en: 'Loads', ru: 'Грузы' },
  'corridors.gross': { en: 'Gross', ru: 'Доход' },
  'corridors.driver': { en: 'Driver', ru: 'Водитель' },
  'corridors.profit': { en: 'Profit', ru: 'Прибыль' },
  'corridors.otr': { en: 'OTR', ru: 'OTR' },
  'corridors.netProfit': { en: 'Net Profit', ru: 'Чист. прибыль' },
  'corridors.margin': { en: 'Margin', ru: 'Маржа' },

  /* ──── Payment flags ──── */
  'flag.quickPay': { en: 'Quick Pay', ru: 'Быстрая оплата' },
  'flag.directPayment': { en: 'Direct Payment', ru: 'Прямая оплата' },
  'flag.factoring': { en: 'Factoring', ru: 'Факторинг' },
  'flag.driverPaid': { en: 'Driver Paid', ru: 'Водитель оплачен' },

  /* ──── Loads page ──── */
  'loads.title': { en: 'Loads', ru: 'Грузы' },
  'loads.week': { en: 'Week:', ru: 'Неделя:' },
  'loads.showArchived': { en: 'Show Archived', ru: 'Показать архив' },
  'loads.salary': { en: 'Salary', ru: 'Зарплата' },
  'loads.statements': { en: 'Statements', ru: 'Отчёты' },
  'loads.exportCsv': { en: 'Export CSV', ru: 'Экспорт CSV' },
  'loads.newLoad': { en: '+ New Load', ru: '+ Новый груз' },
  'loads.loadingWeeks': { en: 'Loading weeks...', ru: 'Загрузка недель...' },
  'loads.loading': { en: 'Loading loads...', ru: 'Загрузка грузов...' },
  'loads.fetchingData': { en: 'Fetching data for the selected week', ru: 'Загрузка данных за выбранную неделю' },
  'loads.noLoads': { en: 'No loads this week', ru: 'Нет грузов за эту неделю' },
  'loads.noLoadsHint': { en: 'Create a new load or switch to a different week.', ru: 'Создайте новый груз или переключите неделю.' },
  'loads.active': { en: 'active', ru: 'активных' },
  'loads.archived': { en: 'archived', ru: 'в архиве' },
  'loads.load': { en: 'load', ru: 'груз' },
  'loads.loads': { en: 'loads', ru: 'грузов' },

  /* ──── Loads table headers ──── */
  'table.sylNumber': { en: 'SYL #', ru: 'SYL #' },
  'table.date': { en: 'Date', ru: 'Дата' },
  'table.business': { en: 'Business', ru: 'Компания' },
  'table.from': { en: 'From', ru: 'Откуда' },
  'table.to': { en: 'To', ru: 'Куда' },
  'table.gross': { en: 'Gross', ru: 'Доход' },
  'table.driverCost': { en: 'Driver Cost', ru: 'Расход водит.' },
  'table.profit': { en: 'Profit', ru: 'Прибыль' },
  'table.profitPct': { en: 'Profit %', ru: 'Прибыль %' },
  'table.otr': { en: 'OTR', ru: 'OTR' },
  'table.netProfit': { en: 'Net Profit', ru: 'Чист. прибыль' },
  'table.status': { en: 'Status', ru: 'Статус' },
  'table.qp': { en: 'QP', ru: 'БО' },
  'table.dp': { en: 'DP', ru: 'ПО' },
  'table.fact': { en: 'Fact', ru: 'Факт' },
  'table.paid': { en: 'Paid', ru: 'Опл.' },
  'table.edit': { en: 'Edit', ru: 'Ред.' },
  'table.view': { en: 'View', ru: 'Просм.' },
  'table.archive': { en: 'Archive', ru: 'Архив' },
  'table.unarchive': { en: 'Unarchive', ru: 'Восстановить' },
  'table.archived': { en: 'ARCHIVED', ru: 'АРХИВ' },

  /* ──── Load form ──── */
  'form.loadIdentity': { en: 'Load Identity', ru: 'Идентификация груза' },
  'form.business': { en: 'Business', ru: 'Компания' },
  'form.route': { en: 'Route', ru: 'Маршрут' },
  'form.financials': { en: 'Financials', ru: 'Финансы' },
  'form.flags': { en: 'Flags', ru: 'Флаги' },
  'form.notes': { en: 'Notes', ru: 'Заметки' },
  'form.sylNumber': { en: 'SYL Number *', ru: 'Номер SYL *' },
  'form.week': { en: 'Week *', ru: 'Неделя *' },
  'form.loadDate': { en: 'Load Date *', ru: 'Дата груза *' },
  'form.status': { en: 'Status', ru: 'Статус' },
  'form.businessName': { en: 'Business Name *', ru: 'Название компании *' },
  'form.dispatcher': { en: 'Dispatcher', ru: 'Диспетчер' },
  'form.unit': { en: 'Unit', ru: 'Юнит' },
  'form.driver': { en: 'Driver', ru: 'Водитель' },
  'form.brokerage': { en: 'Brokerage', ru: 'Брокер' },
  'form.netsuiteRef': { en: 'Netsuite Ref', ru: 'Netsuite Ссылка' },
  'form.fromAddress': { en: 'From Address *', ru: 'Адрес отправки *' },
  'form.fromState': { en: 'From State *', ru: 'Штат отправки *' },
  'form.fromDate': { en: 'From Date *', ru: 'Дата отправки *' },
  'form.toAddress': { en: 'To Address *', ru: 'Адрес доставки *' },
  'form.toState': { en: 'To State *', ru: 'Штат доставки *' },
  'form.toDate': { en: 'To Date *', ru: 'Дата доставки *' },
  'form.miles': { en: 'Miles', ru: 'Мили' },
  'form.grossAmount': { en: 'Gross Amount *', ru: 'Валовая сумма *' },
  'form.driverCostAmount': { en: 'Driver Cost *', ru: 'Расход на водителя *' },
  'form.financeBreakdown': { en: 'Finance Breakdown (preview)', ru: 'Финансовая разбивка (предв.)' },
  'form.financeNote': { en: 'All derived values below are computed by the server. This is a preview only.', ru: 'Все производные значения ниже вычисляются сервером. Это только предварительный просмотр.' },
  'form.optionalComment': { en: 'Optional comment...', ru: 'Комментарий (необязательно)...' },
  'form.back': { en: 'Back', ru: 'Назад' },
  'form.cancel': { en: 'Cancel', ru: 'Отмена' },
  'form.saving': { en: 'Saving...', ru: 'Сохранение...' },
  'form.save': { en: 'Save', ru: 'Сохранить' },
  'form.create': { en: 'Create Load', ru: 'Создать груз' },
  'form.update': { en: 'Update Load', ru: 'Обновить груз' },
  'form.quickPay': { en: 'Quick Pay', ru: 'Быстрая оплата' },
  'form.directPayment': { en: 'Direct Payment', ru: 'Прямая оплата' },
  'form.factoring': { en: 'Factoring', ru: 'Факторинг' },
  'form.driverPaid': { en: 'Driver Paid', ru: 'Водитель оплачен' },

  /* ──── Load drawer ──── */
  'drawer.loading': { en: 'Loading...', ru: 'Загрузка...' },
  'drawer.newLoad': { en: 'New Load', ru: 'Новый груз' },
  'drawer.editLoad': { en: 'Edit Load', ru: 'Редактирование груза' },
  'drawer.viewLoad': { en: 'View Load', ru: 'Просмотр груза' },
  'drawer.archivedReadOnly': { en: 'This load is archived and read-only', ru: 'Этот груз в архиве (только чтение)' },
  'drawer.updateDetails': { en: 'Update load details', ru: 'Обновление деталей груза' },
  'drawer.createEntry': { en: 'Create a new load entry', ru: 'Создание нового груза' },
  'drawer.archivedBanner': { en: 'This load is archived. Unarchive it from the Loads list to make changes.', ru: 'Этот груз в архиве. Разархивируйте его из списка грузов для редактирования.' },
  'drawer.preparingForm': { en: 'Preparing form...', ru: 'Подготовка формы...' },

  /* ──── Export Modal ──── */
  'export.title': { en: 'Export Loads', ru: 'Экспорт грузов' },
  'export.week': { en: 'Week', ru: 'Неделя' },
  'export.paymentFilter': { en: 'Payment Filter', ru: 'Фильтр оплаты' },
  'export.allLoads': { en: 'All Loads', ru: 'Все грузы' },
  'export.quickPayOnly': { en: 'Quick Pay Only', ru: 'Только быстрая оплата' },
  'export.directPaymentOnly': { en: 'Direct Payment Only', ru: 'Только прямая оплата' },
  'export.onlyUnpaid': { en: 'Only Unpaid (driver not paid)', ru: 'Только неоплаченные (водитель не оплачен)' },
  'export.excludeBrokers': { en: 'Exclude Brokers', ru: 'Исключить брокеров' },
  'export.exporting': { en: 'Exporting...', ru: 'Экспорт...' },
  'export.downloadCsv': { en: 'Download CSV', ru: 'Скачать CSV' },
  'export.complete': { en: 'Export complete: {count} row(s) exported.', ru: 'Экспорт завершён: {count} строк(а) экспортировано.' },

  /* ──── Statements ──── */
  'stmt.title': { en: 'Statements', ru: 'Отчёты' },
  'stmt.subtitle': { en: 'Generate and manage driver/owner statements', ru: 'Генерация и управление отчётами водителей/владельцев' },
  'stmt.generate': { en: 'Generate', ru: 'Генерация' },
  'stmt.archive': { en: 'Archive', ru: 'Архив' },
  'stmt.stmtType': { en: 'Statement Type', ru: 'Тип отчёта' },
  'stmt.driver': { en: 'Driver', ru: 'Водитель' },
  'stmt.owner': { en: 'Owner', ru: 'Владелец' },
  'stmt.week': { en: 'Week', ru: 'Неделя' },
  'stmt.paymentFilter': { en: 'Payment Filter', ru: 'Фильтр оплаты' },
  'stmt.allLoads': { en: 'All Loads', ru: 'Все грузы' },
  'stmt.quickPayOnly': { en: 'Quick Pay Only', ru: 'Только быстрая оплата' },
  'stmt.directPaymentOnly': { en: 'Direct Payment Only', ru: 'Только прямая оплата' },
  'stmt.onlyUnpaid': { en: 'Only Unpaid (driver not paid)', ru: 'Только неоплаченные' },
  'stmt.unitLabel': { en: 'Unit', ru: 'Юнит' },
  'stmt.unitPlaceholder': { en: 'Select unit (optional)...', ru: 'Выберите юнит (необязательно)...' },
  'stmt.preview': { en: 'Preview Statement', ru: 'Предпросмотр' },
  'stmt.loadingArchive': { en: 'Loading archive...', ru: 'Загрузка архива...' },
  'stmt.fetchingSaved': { en: 'Fetching saved statements', ru: 'Загрузка сохранённых отчётов' },
  'stmt.noStatements': { en: 'No statements generated yet', ru: 'Отчёты ещё не созданы' },
  'stmt.noStatementsHint': { en: 'Use the Generate tab to create your first statement.', ru: 'Используйте вкладку Генерация для создания первого отчёта.' },
  'stmt.type': { en: 'Type', ru: 'Тип' },
  'stmt.loads': { en: 'Loads', ru: 'Грузы' },
  'stmt.gross': { en: 'Gross', ru: 'Доход' },
  'stmt.netProfit': { en: 'Net Profit', ru: 'Чист. прибыль' },
  'stmt.generated': { en: 'Generated', ru: 'Создан' },
  'stmt.by': { en: 'By', ru: 'Кем' },
  'stmt.view': { en: 'View', ru: 'Просмотр' },
  'stmt.snapshot': { en: 'SNAPSHOT', ru: 'СНИМОК' },
  'stmt.snapshotNote': { en: 'This statement is a read-only snapshot generated on', ru: 'Этот отчёт — снимок данных, созданный' },
  'stmt.driverStatement': { en: 'Driver Statement', ru: 'Отчёт водителя' },
  'stmt.ownerStatement': { en: 'Owner Statement', ru: 'Отчёт владельца' },
  'stmt.noLoadsMatch': { en: 'No loads match the selected filters.', ru: 'Грузы не найдены по выбранным фильтрам.' },

  /* ──── Salary ──── */
  'sal.title': { en: 'Salary Preview', ru: 'Предпросмотр зарплаты' },
  'sal.searchPlaceholder': { en: 'Search by name...', ru: 'Поиск по имени...' },
  'sal.all': { en: 'All', ru: 'Все' },
  'sal.withSalary': { en: 'With Salary', ru: 'С зарплатой' },
  'sal.noSalary': { en: 'No Salary', ru: 'Без зарплаты' },
  'sal.generated': { en: 'Generated', ru: 'Сгенерировано' },
  'sal.open': { en: 'Open', ru: 'Открыта' },
  'sal.frozen': { en: 'Frozen', ru: 'Заморожена' },
  'sal.generatedBy': { en: 'Generated by {name} on {date}', ru: 'Сгенерировал {name}, {date}' },
  'sal.frozenBy': { en: 'Frozen by {name} on {date}', ru: 'Заморозил {name}, {date}' },
  'sal.readOnly': { en: 'READ ONLY', ru: 'ТОЛЬКО ЧТЕНИЕ' },
  'sal.frozenNotice': { en: 'This week is frozen. Generate, recalculate, and adjustment actions are disabled. Unfreeze to make changes.', ru: 'Неделя заморожена. Генерация, пересчёт и корректировки отключены. Разморозьте для изменений.' },
  'sal.recalculate': { en: 'Recalculate', ru: 'Пересчитать' },
  'sal.freeze': { en: 'Freeze', ru: 'Заморозить' },
  'sal.unfreeze': { en: 'Unfreeze', ru: 'Разморозить' },
  'sal.auditLog': { en: 'Audit Log', ru: 'Журнал аудита' },
  'sal.loading': { en: 'Loading salary data...', ru: 'Загрузка данных зарплаты...' },
  'sal.calculating': { en: 'Calculating preview for all dispatchers', ru: 'Расчёт предпросмотра для всех диспетчеров' },
  'sal.noData': { en: 'No salary data', ru: 'Нет данных о зарплате' },
  'sal.noDataHint': { en: 'No dispatchers with loads found for this week, or no active salary rule configured.', ru: 'Нет диспетчеров с грузами за эту неделю или нет активного правила расчёта.' },
  'sal.dispatchers': { en: '{count} dispatcher(s)', ru: '{count} диспетчер(ов)' },
  'sal.accessDenied': { en: 'Access Denied', ru: 'Доступ запрещён' },
  'sal.accessDeniedHint': { en: 'You do not have permission to view salary data. Contact an administrator if you need access.', ru: 'У вас нет прав для просмотра зарплат. Обратитесь к администратору.' },
  'sal.dispatcher': { en: 'Dispatcher', ru: 'Диспетчер' },
  'sal.grossProfit': { en: 'Gross Profit', ru: 'Валовая прибыль' },
  'sal.baseSalary': { en: 'Base Salary', ru: 'Базовая зарплата' },
  'sal.other': { en: 'Other', ru: 'Другое' },
  'sal.bonus': { en: 'Bonus', ru: 'Бонус' },
  'sal.total': { en: 'Total', ru: 'Итого' },
  'sal.status': { en: 'Status', ru: 'Статус' },
  'sal.actions': { en: 'Actions', ru: 'Действия' },
  'sal.pending': { en: 'Pending', ru: 'Ожидание' },
  'sal.adjust': { en: 'Adjust', ru: 'Корректир.' },
  'sal.generate': { en: 'Generate', ru: 'Сгенерировать' },
  'sal.view': { en: 'View', ru: 'Просмотр' },
  'sal.totals': { en: 'Totals ({count})', ru: 'Итого ({count})' },
  'sal.backToSalary': { en: '← Back to Salary', ru: '← Назад к зарплате' },
  'sal.ruleSet': { en: 'Rule Set', ru: 'Набор правил' },
  'sal.tier': { en: 'Tier', ru: 'Уровень' },
  'sal.totalSalary': { en: 'Total Salary', ru: 'Итого зарплата' },
  'sal.loadingRecord': { en: 'Loading salary record...', ru: 'Загрузка записи зарплаты...' },

  /* ──── Salary Audit Log ──── */
  'audit.title': { en: 'Audit Log', ru: 'Журнал аудита' },
  'audit.noEntries': { en: 'No audit entries for this week.', ru: 'Нет записей аудита за эту неделю.' },
  'audit.time': { en: 'Time', ru: 'Время' },
  'audit.action': { en: 'Action', ru: 'Действие' },
  'audit.by': { en: 'By', ru: 'Кем' },
  'audit.detail': { en: 'Detail', ru: 'Подробности' },

  /* ──── Adjustment Modal ──── */
  'adj.title': { en: 'Adjustments for {name}', ru: 'Корректировки для {name}' },
  'adj.noAdjustments': { en: 'No adjustments yet. Add Other or Bonus entries below.', ru: 'Корректировок пока нет. Добавьте записи ниже.' },
  'adj.type': { en: 'Type', ru: 'Тип' },
  'adj.amount': { en: 'Amount ($)', ru: 'Сумма ($)' },
  'adj.note': { en: 'Note', ru: 'Примечание' },
  'adj.notePlaceholder': { en: 'Required note...', ru: 'Обязательное примечание...' },
  'adj.addOther': { en: '+ Other', ru: '+ Другое' },
  'adj.addBonus': { en: '+ Bonus', ru: '+ Бонус' },
  'adj.save': { en: 'Save Adjustments', ru: 'Сохранить' },

  /* ──── Settings ──── */
  'settings.title': { en: 'Settings', ru: 'Настройки' },
  'settings.subtitle': { en: 'Manage salary rules and system configuration', ru: 'Управление правилами расчёта и конфигурацией' },
  'settings.salaryRules': { en: 'Salary Rule Sets', ru: 'Наборы правил зарплаты' },
  'settings.newRuleSet': { en: '+ New Rule Set', ru: '+ Новый набор правил' },
  'settings.accessDenied': { en: 'Access Denied', ru: 'Доступ запрещён' },
  'settings.accessDeniedHint': { en: 'You do not have permission to view salary rule settings. Contact an administrator if you need access.', ru: 'У вас нет прав для просмотра настроек зарплаты. Обратитесь к администратору.' },
  'settings.loading': { en: 'Loading rules...', ru: 'Загрузка правил...' },
  'settings.loadingHint': { en: 'Fetching salary rule configurations', ru: 'Загрузка конфигураций правил расчёта' },
  'settings.noRules': { en: 'No salary rule sets configured', ru: 'Наборы правил не настроены' },
  'settings.noRulesHint': { en: 'Create a rule set to define dispatcher salary brackets.', ru: 'Создайте набор правил для определения зарплатных уровней.' },
  'settings.name': { en: 'Name', ru: 'Название' },
  'settings.version': { en: 'Version', ru: 'Версия' },
  'settings.status': { en: 'Status', ru: 'Статус' },
  'settings.effectiveFrom': { en: 'Effective From', ru: 'Действует с' },
  'settings.tiers': { en: 'Tiers', ru: 'Уровни' },
  'settings.createdBy': { en: 'Created By', ru: 'Создал' },
  'settings.actions': { en: 'Actions', ru: 'Действия' },
  'settings.active': { en: 'Active', ru: 'Активен' },
  'settings.inactive': { en: 'Inactive', ru: 'Неактивен' },
  'settings.edit': { en: 'Edit', ru: 'Ред.' },
  'settings.deactivate': { en: 'Deactivate', ru: 'Деактивировать' },
  'settings.activate': { en: 'Activate', ru: 'Активировать' },

  /* ──── Users management ──── */
  'users.title': { en: 'Platform Users', ru: 'Пользователи платформы' },
  'users.subtitle': { en: 'Users with access to the platform', ru: 'Пользователи с доступом к платформе' },
  'users.addUser': { en: '+ Add User', ru: '+ Добавить' },
  'users.name': { en: 'Name', ru: 'Имя' },
  'users.email': { en: 'Email', ru: 'Эл. почта' },
  'users.role': { en: 'Role', ru: 'Роль' },
  'users.joined': { en: 'Joined', ru: 'Дата регистрации' },
  'users.noUsers': { en: 'No users found', ru: 'Пользователи не найдены' },
  'users.noUsersHint': { en: 'Add users to grant platform access.', ru: 'Добавьте пользователей для доступа к платформе.' },
  'users.loading': { en: 'Loading users...', ru: 'Загрузка пользователей...' },
  'users.createTitle': { en: 'Create New User', ru: 'Создание нового пользователя' },
  'users.firstName': { en: 'First Name', ru: 'Имя' },
  'users.lastName': { en: 'Last Name', ru: 'Фамилия' },
  'users.password': { en: 'Password', ru: 'Пароль' },
  'users.creating': { en: 'Creating...', ru: 'Создание...' },
  'users.create': { en: 'Create User', ru: 'Создать' },
  'users.cancel': { en: 'Cancel', ru: 'Отмена' },
  'users.roleAdmin': { en: 'Admin', ru: 'Администратор' },
  'users.roleDispatcher': { en: 'Dispatcher', ru: 'Диспетчер' },
  'users.roleAssistant': { en: 'Assistant', ru: 'Ассистент' },
  'users.roleAccountant': { en: 'Accountant', ru: 'Бухгалтер' },

  /* ──── Settings tabs ──── */
  'settings.tabRules': { en: 'Salary Rules', ru: 'Правила зарплаты' },
  'settings.tabUsers': { en: 'Users', ru: 'Пользователи' },

  /* ──── Common ──── */
  'common.loading': { en: 'Loading...', ru: 'Загрузка...' },
  'common.error': { en: 'Something went wrong', ru: 'Что-то пошло не так' },
  'common.close': { en: 'Close', ru: 'Закрыть' },
  'common.cancel': { en: 'Cancel', ru: 'Отмена' },
  'common.save': { en: 'Save', ru: 'Сохранить' },
  'common.search': { en: 'Search or select...', ru: 'Поиск или выбор...' },
  'common.none': { en: '— None —', ru: '— Нет —' },
  'common.noItems': { en: 'No items available', ru: 'Нет доступных элементов' },
  'common.noMatches': { en: 'No matches', ru: 'Совпадений нет' },
  'common.typeToFilter': { en: 'Type to filter...', ru: 'Введите для фильтрации...' },
  'common.current': { en: 'current', ru: 'текущая' },
  'common.authenticating': { en: 'Authenticating...', ru: 'Авторизация...' },
  'common.weekLoadError': { en: 'Week load error', ru: 'Ошибка загрузки недель' },
  'common.language': { en: 'Language', ru: 'Язык' },
  'common.english': { en: 'EN', ru: 'EN' },
  'common.russian': { en: 'RU', ru: 'RU' },

  /* ──── Statements extra ──── */
  'stmt.accessDenied': { en: 'Access Denied', ru: 'Доступ запрещён' },
  'stmt.accessDeniedHint': { en: 'You do not have permission to view statements. Contact an administrator if you need access.', ru: 'У вас нет прав для просмотра отчётов. Обратитесь к администратору.' },
};

/* ═══════════════════════════════════════════════════════
   Context & Provider
   ═══════════════════════════════════════════════════════ */

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem(STORAGE_KEY, newLang);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const entry = dict[key];
      let text = entry ? entry[lang] : key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replace(`{${k}}`, String(v));
        }
      }
      return text;
    },
    [lang],
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
