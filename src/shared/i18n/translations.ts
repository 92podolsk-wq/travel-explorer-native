import type { Difficulty, PoiTag, Season } from "@/entities/poi/model/types";
import type { Language } from "./types";

// Ported from the web app's src/shared/i18n/translations.ts — trimmed to only
// the sections the native app actually renders (app/tag/difficulty/season/
// auth/report/photoUpload). "poi" (per-seed-POI copy overrides), "welcome"
// (marketing landing page) and "trip" (public share page) aren't used here.
type TranslationDictionary = {
  app: {
    searchPlaceholder: string;
    poiPreviewView: string;
    checklistCardTitle: string;
    checklistSetDate: string;
    checklistDateSet: string;
    checklistTripNamePlaceholder: string;
    checklistDaysUntilTrip: string;
    checklistPackingTitle: string;
    checklistDocumentsTitle: string;
    checklistShoppingTitle: string;
    checklistDepartureTitle: string;
    checklistAddPlaceholder: string;
    checklistDeleteItem: string;
    checklistFilterAll: string;
    checklistFilterIncomplete: string;
    checklistFilterComplete: string;
    checklistAllDoneTitle: string;
    checklistAllDoneBody: string;
    save: string;
    mustVisit: string;
    photo: string;
    best: string;
    duration: string;
    effort: string;
    bestTime: string;
    signals: string;
    minutesShort: string;
    visited: string;
    share: string;
    linkCopied: string;
    noSeasonPhotoHint: string;
    previousPlace: string;
    nextPlace: string;
    on: string;
    off: string;
    kyoto: string;
    chooseCity: string;
    countryLabel: string;
    selectWholeCountry: string;
    greetingMorning: string;
    greetingDay: string;
    greetingEvening: string;
    greetingNight: string;
    impreciseLocationTitle: string;
    impreciseLocationBody: string;
    impreciseLocationCancel: string;
    impreciseLocationOpenSettings: string;
    categoryFiltersButton: string;
    categoryFiltersTitle: string;
    categoryFiltersSelectAll: string;
    categoryFiltersClearAll: string;
    categoryFiltersDone: string;
    newMarkerTitle: string;
    markerLabelPlaceholder: string;
    markerCountLabel: string;
    markerLimitReached: string;
    markerSaveError: string;
    markerCancel: string;
    markerSave: string;
    markerSaving: string;
    addMarkerToItinerary: string;
    removeMarkerFromItinerary: string;
    deleteMarker: string;
    deleteMarkerConfirm: string;
    now: string;
    tomorrow: string;
    seasonReminder: string;
    seasonReminderToday: string;
    swipeDiscovery: string;
    swipeDiscoveryHint: string;
    swipeAffinityIntro: string;
    swipeEmpty: string;
    swipeLike: string;
    swipeSkip: string;
    swipeProgress: string;
    swipeClose: string;
    swipeContinueHint: string;
    swipeContinueIn: string;
  };
  tag: Record<PoiTag, string>;
  difficulty: Record<Difficulty, string>;
  season: Record<Season, string>;
  auth: {
    login: string;
    register: string;
    logout: string;
    email: string;
    password: string;
    name: string;
    username: string;
    usernameHint: string;
    editProfile: string;
    save: string;
    profileUpdated: string;
    hideFromSearch: string;
    friendsTitle: string;
    friendsSearchPlaceholder: string;
    friendsSearching: string;
    friendsNoResults: string;
    friendsAdd: string;
    friendsAlreadyFriends: string;
    friendsRequestSent: string;
    friendsRespondBelow: string;
    friendsIncomingTitle: string;
    friendsAccept: string;
    friendsDecline: string;
    friendsOutgoingTitle: string;
    friendsCancel: string;
    friendsListTitle: string;
    friendsLoading: string;
    friendsEmpty: string;
    friendsRemove: string;
    itineraryShareCanEdit: string;
    shareChecklist: string;
    sharedChecklistsTitle: string;
    shareItineraryWithFriend: string;
    sharedItinerariesTitle: string;
    heroTagline: string;
    loginTitle: string;
    registerTitle: string;
    loginSubtitle: string;
    registerSubtitle: string;
    confirmPassword: string;
    passwordMismatch: string;
    continueWith: string;
    comingSoon: string;
    loginWithYandex: string;
    yandexError: string;
    submit: string;
    switchToRegister: string;
    switchToLogin: string;
    savedPlaces: string;
    viewedPlaces: string;
    visitedPlaces: string;
    noSavedPlaces: string;
    noViewedPlaces: string;
    noVisitedPlaces: string;
    chooseAvatar: string;
    clearViewed: string;
    clearViewedConfirm: string;
    clearSaved: string;
    clearSavedConfirm: string;
    clearVisited: string;
    clearVisitedConfirm: string;
    cancel: string;
    ok: string;
    delete: string;
    addToItinerary: string;
    addAllToItinerary: string;
    addRegionToItinerary: string;
    favoritesStatsSaved: string;
    favoritesStatsRegions: string;
    favoritesStatsDays: string;
    favoritesStatsDaysUnit: string;
    favoritesCtaTitle: string;
    favoritesCtaBody: string;
    favoritesCtaButton: string;
    favoritesProgressTitle: string;
    favoritesProgressPlacesUnit: string;
    favoritesMapOpen: string;
    removeFromFavorites: string;
    inItinerary: string;
    clearItinerary: string;
    clearItineraryConfirm: string;
    dayLabel: string;
    generateItinerary: string;
    generateItineraryDays: string;
    generateItineraryHoursPerDay: string;
    generateItinerarySourceFavorites: string;
    generateItinerarySourceRecommended: string;
    generateItinerarySubmit: string;
    generateItineraryConfirm: string;
    generateItineraryEmpty: string;
    dayStart: string;
    lunchBreak: string;
    addDay: string;
    removeDay: string;
    removeDayConfirm: string;
    dayPlaceCount: string;
    addLocation: string;
    addLocationTitle: string;
    addLocationEmpty: string;
    stepsApprox: string;
    markVisited: string;
    notesPlaceholder: string;
    dayNotesPlaceholder: string;
    notesDone: string;
    newItinerary: string;
    deleteItinerary: string;
    deleteItineraryConfirm: string;
    maxItinerariesReached: string;
    stopDurationCustom: string;
    resetDuration: string;
    lunchStartTime: string;
    lunchDuration: string;
    tabRoute: string;
    tabSaved: string;
    tabHistory: string;
    tabProfile: string;
    tabMap: string;
    pushNotificationsTitle: string;
    pushNotificationsHint: string;
    pushNotificationsDenied: string;
    nearbyAlertsTitle: string;
    nearbyAlertsHint: string;
    nearbyAlertsPermissionDenied: string;
    nearbyAlertsPermissionHint: string;
    openSettings: string;
    offlineMapsTitle: string;
    offlineMapsHint: string;
    offlineMapDownload: string;
    offlineMapDelete: string;
    offlineMapDeleteConfirm: string;
    offlineMapDeleteConfirmBody: string;
    offlineMapDownloadError: string;
    offlineMapsDownloadedSummary: string;
    offlineMapsEmpty: string;
    offlineMapsInfoHint: string;
    statsSaved: string;
    statsRoutes: string;
    travelerBadge: string;
    notificationsCardTitle: string;
    notificationHistoryTitle: string;
    notificationHistoryEmpty: string;
    notificationHistoryClearAll: string;
    notificationHistoryDelete: string;
    appSettingsTitle: string;
    themeTitle: string;
    themeLight: string;
    themeDark: string;
    themeSystem: string;
    unitsTitle: string;
    unitsKm: string;
    unitsMi: string;
    storageTitle: string;
    clearCache: string;
    clearCacheConfirmTitle: string;
    clearCacheConfirmBody: string;
    clearCacheDone: string;
    resetSettings: string;
    resetSettingsConfirmTitle: string;
    resetSettingsConfirmBody: string;
    aboutTitle: string;
    aboutVersion: string;
    aboutSupport: string;
    aboutWebsite: string;
    languageTitle: string;
    logoutConfirmTitle: string;
    logoutConfirmBody: string;
    myRoute: string;
    myRouteEmpty: string;
    createItinerary: string;
    clearRoute: string;
    clearRouteConfirm: string;
    dayEmptyPlaceholder: string;
    saved: string;
    history: string;
    visited: string;
    viewed: string;
    moveToDay: string;
    day: string;
    startLabel: string;
    lunchLabel: string;
    walkLabel: string;
    lunchAtLabel: string;
    resetLabel: string;
    buildRoute: string;
    generate: string;
    tripStartDate: string;
    tripStartDateSet: string;
    city: string;
    source: string;
    days: string;
    hoursPerDay: string;
    searchPlacesPlaceholder: string;
    hourUnit: string;
    mapPointFallbackName: string;
    loginError: string;
    registerError: string;
    guestPrompt: string;
    bootErrorTitle: string;
    bootErrorBody: string;
    retry: string;
    offlineModeBanner: string;
  };
  report: {
    cta: string;
    title: string;
    placeholder: string;
    submit: string;
    sending: string;
    cancel: string;
    thanks: string;
    close: string;
    error: string;
  };
};

export const translations: Record<Language, TranslationDictionary> = {
  ru: {
    app: {
      searchPlaceholder: "Поиск мест",
      poiPreviewView: "Посмотреть",
      checklistCardTitle: "Чек-лист поездки",
      checklistSetDate: "Указать дату поездки",
      checklistDateSet: "Поездка {date}",
      checklistTripNamePlaceholder: "Название поездки",
      checklistDaysUntilTrip: "через {n} дн.",
      checklistPackingTitle: "Взять с собой",
      checklistDocumentsTitle: "Документы",
      checklistShoppingTitle: "Купить",
      checklistDepartureTitle: "Перед выездом",
      checklistAddPlaceholder: "Добавить пункт",
      checklistDeleteItem: "Удалить",
      checklistFilterAll: "Все",
      checklistFilterIncomplete: "Не выполнено",
      checklistFilterComplete: "Выполнено",
      checklistAllDoneTitle: "Всё готово!",
      checklistAllDoneBody: "Можно отправляться в поездку.",
      save: "Сохранить",
      mustVisit: "Обязательно",
      photo: "Фото",
      best: "Лучше",
      duration: "Время",
      effort: "Сложность",
      bestTime: "Лучшее время",
      signals: "Признаки",
      minutesShort: "мин",
      visited: "Посещено",
      share: "Поделиться",
      linkCopied: "Ссылка скопирована",
      noSeasonPhotoHint: "Нет фото для этого сезона — показано стандартное",
      previousPlace: "Назад",
      nextPlace: "Далее",
      on: "Вкл",
      off: "Выкл",
      kyoto: "Киото",
      chooseCity: "Выберите город",
      countryLabel: "Страна",
      selectWholeCountry: "Показать все локации страны",
      greetingMorning: "Доброе утро!",
      greetingDay: "Добрый день!",
      greetingEvening: "Добрый вечер!",
      greetingNight: "Доброй ночи!",
      impreciseLocationTitle: "Включено приблизительное местоположение",
      impreciseLocationBody:
        "Ваше местоположение обновляется реже и менее точно. Для точной геолокации на карте включите «Точное местоположение» в настройках приложения.",
      impreciseLocationCancel: "Понятно",
      impreciseLocationOpenSettings: "Открыть настройки",
      categoryFiltersButton: "Категории",
      categoryFiltersTitle: "Категории",
      categoryFiltersSelectAll: "Выбрать все",
      categoryFiltersClearAll: "Снять все",
      categoryFiltersDone: "Готово",
      newMarkerTitle: "Новая метка",
      markerLabelPlaceholder: "Название (необязательно)",
      markerCountLabel: "{count} / {limit} меток",
      markerLimitReached: "Достигнут лимит меток ({limit})",
      markerSaveError: "Не удалось сохранить метку. Попробуйте ещё раз.",
      markerCancel: "Отмена",
      markerSave: "Сохранить",
      markerSaving: "Сохранение…",
      addMarkerToItinerary: "Добавить в маршрут",
      removeMarkerFromItinerary: "Убрать из маршрута",
      deleteMarker: "Удалить метку",
      deleteMarkerConfirm: "Метка будет удалена без возможности восстановления.",
      now: "Сейчас",
      tomorrow: "Завтра",
      seasonReminder: "Через {days} дн. в {city} начинается сезон: {season}",
      seasonReminderToday: "Сегодня в {city} начинается сезон: {season}",
      swipeDiscovery: "Быстрый выбор",
      swipeDiscoveryHint: "Пролистайте места: нравится — сохранить, пропустить — отметить просмотренным",
      swipeAffinityIntro: "Вы любите:",
      swipeEmpty: "Вы просмотрели все места здесь.",
      swipeLike: "Нравится",
      swipeSkip: "Пропустить",
      swipeProgress: "{current} из {total}",
      swipeClose: "Закрыть",
      swipeContinueHint: "Продолжить в соседних городах",
      swipeContinueIn: "{region} · {count} мест"
    },
    tag: {
      "must-visit": "обязательно",
      photographer: "фотографу",
      "first-visit": "первый визит",
      nature: "природа",
      autumn: "осень",
      sakura: "сакура",
      "hidden-gem": "скрытое место",
      sunrise: "рассвет",
      night: "ночь",
      rain: "дождь",
      "public-transport": "общественный транспорт",
      "light-trekking": "легкий треккинг"
    },
    difficulty: { easy: "легко", moderate: "средне", active: "активно" },
    season: { spring: "Весна", summer: "Лето", autumn: "Осень", winter: "Зима" },
    auth: {
      login: "Войти",
      register: "Регистрация",
      logout: "Выйти",
      email: "Email",
      password: "Пароль",
      name: "Имя",
      username: "Логин",
      usernameHint: "3-20 символов: латинские буквы, цифры или подчёркивание",
      editProfile: "Редактировать профиль",
      save: "Сохранить",
      profileUpdated: "Профиль обновлён",
      hideFromSearch: "Не показывать меня в поиске друзей",
      friendsTitle: "Друзья",
      friendsSearchPlaceholder: "Поиск по логину",
      friendsSearching: "Поиск…",
      friendsNoResults: "Пользователи не найдены",
      friendsAdd: "Добавить",
      friendsAlreadyFriends: "Уже друзья",
      friendsRequestSent: "Запрос отправлен",
      friendsRespondBelow: "Ответьте ниже",
      friendsIncomingTitle: "Заявки в друзья",
      friendsAccept: "Принять",
      friendsDecline: "Отклонить",
      friendsOutgoingTitle: "Отправленные заявки",
      friendsCancel: "Отменить",
      friendsListTitle: "Ваши друзья",
      friendsLoading: "Загрузка…",
      friendsEmpty: "Пока нет друзей",
      friendsRemove: "Удалить",
      itineraryShareCanEdit: "Редактор",
      shareChecklist: "Поделиться",
      sharedChecklistsTitle: "Чек-листы, которыми с вами поделились",
      shareItineraryWithFriend: "Поделиться",
      sharedItinerariesTitle: "Маршруты, которыми с вами поделились",
      heroTagline: "Открой. Исследуй. Запомни.",
      loginTitle: "Вход",
      registerTitle: "Создать аккаунт",
      loginSubtitle: "С возвращением! Рады видеть вас снова.",
      registerSubtitle: "Начните своё путешествие с Wayora",
      confirmPassword: "Подтвердите пароль",
      passwordMismatch: "Пароли не совпадают",
      continueWith: "или продолжить через",
      comingSoon: "Скоро будет доступно",
      loginWithYandex: "Войти через Яндекс",
      yandexError: "Не удалось войти через Яндекс.",
      submit: "Продолжить",
      switchToRegister: "Нет аккаунта? Зарегистрироваться",
      switchToLogin: "Уже есть аккаунт? Войти",
      savedPlaces: "Сохранённые места",
      viewedPlaces: "Просмотренные места",
      visitedPlaces: "Посещённые места",
      noSavedPlaces: "Пока нет сохранённых мест",
      noViewedPlaces: "Пока нет просмотренных мест",
      noVisitedPlaces: "Пока нет посещённых мест",
      chooseAvatar: "Выберите аватар",
      clearViewed: "Очистить",
      clearViewedConfirm: "Очистить все просмотренные места? Это действие нельзя отменить.",
      clearSaved: "Очистить",
      clearSavedConfirm: "Очистить все сохранённые места? Это действие нельзя отменить.",
      clearVisited: "Очистить",
      clearVisitedConfirm: "Очистить все посещённые места? Это действие нельзя отменить.",
      cancel: "Отмена",
      ok: "ОК",
      delete: "Удалить",
      addToItinerary: "В маршрут",
      addAllToItinerary: "Добавить все",
      addRegionToItinerary: "Добавить все места этого региона в маршрут",
      favoritesStatsSaved: "Сохранено мест",
      favoritesStatsRegions: "Региона",
      favoritesStatsDays: "Хватит на поездку",
      favoritesStatsDaysUnit: "дня",
      favoritesCtaTitle: "Отлично!",
      favoritesCtaBody: "У вас достаточно мест для путешествия на {days} дня.",
      favoritesCtaButton: "Составить маршрут",
      favoritesProgressTitle: "Прогресс по регионам",
      favoritesProgressPlacesUnit: "мест",
      favoritesMapOpen: "Открыть карту",
      removeFromFavorites: "Убрать из избранного",
      inItinerary: "В маршруте",
      clearItinerary: "Очистить маршрут",
      clearItineraryConfirm: "Все дни и точки будут удалены.",
      dayLabel: "День {n}",
      generateItinerary: "Сгенерировать",
      generateItineraryDays: "Дней",
      generateItineraryHoursPerDay: "Часов в день",
      generateItinerarySourceFavorites: "Избранное",
      generateItinerarySourceRecommended: "Рекомендуемое",
      generateItinerarySubmit: "Построить",
      generateItineraryConfirm: "Это заменит текущий маршрут. Продолжить?",
      generateItineraryEmpty: "Не удалось построить маршрут. Попробуйте другой город или источник мест.",
      dayStart: "Начало",
      lunchBreak: "Обед",
      addDay: "Добавить день",
      removeDay: "Удалить день",
      removeDayConfirm: "Удалить этот день и все его точки? Это действие нельзя отменить.",
      dayPlaceCount: "{count} мест",
      addLocation: "Добавить локацию",
      addLocationTitle: "Добавить локацию",
      addLocationEmpty: "Ничего не найдено",
      stepsApprox: "~{count} шагов",
      markVisited: "Отметить посещённым",
      notesPlaceholder: "Заметка к точке…",
      dayNotesPlaceholder: "Заметка к дню…",
      notesDone: "Готово",
      newItinerary: "Создать маршрут",
      deleteItinerary: "Удалить маршрут",
      deleteItineraryConfirm: "«{title}» будет удалён без возможности восстановления.",
      maxItinerariesReached: "Можно создать не более 3 маршрутов одновременно.",
      stopDurationCustom: "Своё",
      resetDuration: "сброс",
      lunchStartTime: "после",
      lunchDuration: "мин",
      tabRoute: "Маршрут",
      tabSaved: "Избранное",
      tabHistory: "История",
      tabProfile: "Профиль",
      tabMap: "Карта",
      pushNotificationsTitle: "Push-уведомления",
      pushNotificationsHint: "Напоминания о сезонных событиях и новостях Wayora",
      pushNotificationsDenied: "Уведомления отключены в системе",
      nearbyAlertsTitle: "Локации поблизости",
      nearbyAlertsHint: "Уведомлять, когда вы окажетесь в 500 м от избранной локации",
      nearbyAlertsPermissionDenied: "Нужен доступ к геолокации «Всегда»",
      nearbyAlertsPermissionHint: "Разрешите доступ к местоположению в настройках, чтобы получать уведомления о локациях поблизости даже когда приложение закрыто.",
      openSettings: "Открыть настройки",
      offlineMapsTitle: "Карты офлайн",
      offlineMapsHint: "Управляйте скачанными картами",
      offlineMapDownload: "Скачать",
      offlineMapDelete: "Удалить",
      offlineMapDeleteConfirm: "Удалить карту «{name}»?",
      offlineMapDeleteConfirmBody: "Загруженные тайлы будут удалены с устройства.",
      offlineMapDownloadError: "Не удалось скачать карту. Попробуйте ещё раз позже.",
      offlineMapsDownloadedSummary: "Скачано {count} из {total} · Занято {size} МБ",
      offlineMapsEmpty: "Пока нет скачанных карт. Скачайте карту региона на экране Карты.",
      offlineMapsInfoHint: "Чтобы скачать карту региона офлайн, откройте его на экране Карты и нажмите на значок облака.",
      statsSaved: "Сохранено",
      statsRoutes: "Маршрута",
      travelerBadge: "Путешественник",
      notificationsCardTitle: "Уведомления",
      notificationHistoryTitle: "История уведомлений",
      notificationHistoryEmpty: "Пока нет уведомлений",
      notificationHistoryClearAll: "Очистить всё",
      notificationHistoryDelete: "Удалить",
      appSettingsTitle: "Настройки приложения",
      themeTitle: "Тема",
      themeLight: "Светлая",
      themeDark: "Тёмная",
      themeSystem: "Как в системе",
      unitsTitle: "Единицы измерения",
      unitsKm: "Км",
      unitsMi: "Мили",
      storageTitle: "Хранилище и данные",
      clearCache: "Очистить кэш",
      clearCacheConfirmTitle: "Очистить кэш?",
      clearCacheConfirmBody: "Скачанные офлайн-фото локаций будут удалены с устройства. Карты городов останутся.",
      clearCacheDone: "Кэш очищен",
      resetSettings: "Сбросить настройки",
      resetSettingsConfirmTitle: "Сбросить настройки?",
      resetSettingsConfirmBody: "Тема, язык, единицы измерения и уведомления о локациях поблизости вернутся к значениям по умолчанию.",
      aboutTitle: "О приложении",
      aboutVersion: "Версия",
      aboutSupport: "Поддержка",
      aboutWebsite: "Сайт wayora.ru",
      languageTitle: "Язык приложения",
      logoutConfirmTitle: "Выйти из аккаунта?",
      logoutConfirmBody: "Понадобится снова войти, чтобы получить доступ к маршрутам и избранному.",
      myRoute: "Мой маршрут",
      myRouteEmpty: "У вас пока нет маршрута",
      createItinerary: "Создать маршрут",
      clearRoute: "Очистить",
      clearRouteConfirm: "Маршрут пуст",
      dayEmptyPlaceholder: "Постройте маршрут автоматически или добавьте день вручную.",
      saved: "Избранное",
      history: "История",
      visited: "Посещённые места",
      viewed: "Просмотренные места",
      moveToDay: "Перенести в день",
      day: "День",
      startLabel: "Начало",
      lunchLabel: "Обед",
      walkLabel: "мин",
      lunchAtLabel: "Обед в",
      resetLabel: "сброс",
      buildRoute: "Построить маршрут",
      generate: "Сгенерировать",
      tripStartDate: "Указать дату начала поездки",
      tripStartDateSet: "Поездка начинается {date}",
      city: "Город",
      source: "Источник мест",
      days: "Дней",
      hoursPerDay: "Часов в день",
      searchPlacesPlaceholder: "Поиск мест",
      hourUnit: "ч",
      mapPointFallbackName: "Точка на карте",
      loginError: "Неверный email или пароль.",
      registerError: "Не удалось зарегистрироваться.",
      guestPrompt: "Войдите, чтобы сохранять места, отмечать посещённое и планировать маршруты",
      bootErrorTitle: "Не удалось загрузить данные",
      bootErrorBody: "Проверьте подключение к интернету и попробуйте ещё раз.",
      retry: "Повторить",
      offlineModeBanner: "Нет связи с сервером — показаны сохранённые данные"
    },
    report: {
      cta: "Нашли неточность в описании локации?",
      title: "Сообщить о неточности",
      placeholder: "Опишите, в чём заключается неточность...",
      submit: "Отправить",
      sending: "Отправка…",
      cancel: "Отмена",
      thanks: "Спасибо за обратную связь! Мы скоро всё проверим.",
      close: "Закрыть",
      error: "Не удалось отправить. Попробуйте ещё раз."
    }
  },
  en: {
    app: {
      searchPlaceholder: "Search places",
      poiPreviewView: "View",
      checklistCardTitle: "Trip checklist",
      checklistSetDate: "Set trip date",
      checklistDateSet: "Trip on {date}",
      checklistTripNamePlaceholder: "Trip name",
      checklistDaysUntilTrip: "{n} days to go",
      checklistPackingTitle: "To pack",
      checklistDocumentsTitle: "Documents",
      checklistShoppingTitle: "To buy",
      checklistDepartureTitle: "Before you leave",
      checklistAddPlaceholder: "Add an item",
      checklistDeleteItem: "Delete",
      checklistFilterAll: "All",
      checklistFilterIncomplete: "To do",
      checklistFilterComplete: "Done",
      checklistAllDoneTitle: "All set!",
      checklistAllDoneBody: "You're ready for the trip.",
      save: "Save",
      mustVisit: "Must Visit",
      photo: "Photo",
      best: "Best",
      duration: "Duration",
      effort: "Effort",
      bestTime: "Best Time",
      signals: "Signals",
      minutesShort: "m",
      visited: "Visited",
      share: "Share",
      linkCopied: "Link copied",
      noSeasonPhotoHint: "No photo for this season — showing the default one",
      previousPlace: "Previous",
      nextPlace: "Next",
      on: "On",
      off: "Off",
      kyoto: "Kyoto",
      chooseCity: "Choose a city",
      countryLabel: "Country",
      selectWholeCountry: "Show every location in this country",
      greetingMorning: "Good morning!",
      greetingDay: "Good afternoon!",
      greetingEvening: "Good evening!",
      greetingNight: "Good night!",
      impreciseLocationTitle: "Approximate location is on",
      impreciseLocationBody:
        "Your position updates less often and less precisely. For accurate positioning on the map, enable \"Precise location\" in the app's settings.",
      impreciseLocationCancel: "Got it",
      impreciseLocationOpenSettings: "Open Settings",
      categoryFiltersButton: "Categories",
      categoryFiltersTitle: "Categories",
      categoryFiltersSelectAll: "Select all",
      categoryFiltersClearAll: "Clear all",
      categoryFiltersDone: "Done",
      newMarkerTitle: "New marker",
      markerLabelPlaceholder: "Label (optional)",
      markerCountLabel: "{count} / {limit} markers",
      markerLimitReached: "Marker limit reached ({limit} markers)",
      markerSaveError: "Couldn't save the marker. Try again.",
      markerCancel: "Cancel",
      markerSave: "Save",
      markerSaving: "Saving…",
      addMarkerToItinerary: "Add to itinerary",
      removeMarkerFromItinerary: "Remove from itinerary",
      deleteMarker: "Delete marker",
      deleteMarkerConfirm: "The marker will be permanently deleted.",
      now: "Now",
      tomorrow: "Tomorrow",
      seasonReminder: "{season} season starts in {city} in {days} days",
      seasonReminderToday: "{season} season starts today in {city}",
      swipeDiscovery: "Quick picks",
      swipeDiscoveryHint: "Swipe through places: like to save, skip to mark as seen",
      swipeAffinityIntro: "You love:",
      swipeEmpty: "You've gone through every place here.",
      swipeLike: "Like",
      swipeSkip: "Skip",
      swipeProgress: "{current} of {total}",
      swipeClose: "Close",
      swipeContinueHint: "Keep swiping nearby",
      swipeContinueIn: "{region} · {count} places"
    },
    tag: {
      "must-visit": "must visit",
      photographer: "photographer",
      "first-visit": "first visit",
      nature: "nature",
      autumn: "autumn",
      sakura: "sakura",
      "hidden-gem": "hidden gem",
      sunrise: "sunrise",
      night: "night",
      rain: "rain",
      "public-transport": "public transport",
      "light-trekking": "light trekking"
    },
    difficulty: { easy: "easy", moderate: "moderate", active: "active" },
    season: { spring: "Spring", summer: "Summer", autumn: "Autumn", winter: "Winter" },
    auth: {
      login: "Log in",
      register: "Register",
      logout: "Log out",
      email: "Email",
      password: "Password",
      name: "Name",
      username: "Username",
      usernameHint: "3-20 characters: letters, numbers, underscore",
      editProfile: "Edit profile",
      save: "Save",
      profileUpdated: "Profile updated",
      hideFromSearch: "Don't show me in friend search",
      friendsTitle: "Friends",
      friendsSearchPlaceholder: "Search by username",
      friendsSearching: "Searching…",
      friendsNoResults: "No users found",
      friendsAdd: "Add",
      friendsAlreadyFriends: "Already friends",
      friendsRequestSent: "Request sent",
      friendsRespondBelow: "Respond below",
      friendsIncomingTitle: "Friend requests",
      friendsAccept: "Accept",
      friendsDecline: "Decline",
      friendsOutgoingTitle: "Sent requests",
      friendsCancel: "Cancel",
      friendsListTitle: "Your friends",
      friendsLoading: "Loading…",
      friendsEmpty: "No friends yet",
      friendsRemove: "Remove",
      itineraryShareCanEdit: "Editor",
      shareChecklist: "Share",
      sharedChecklistsTitle: "Checklists shared with you",
      shareItineraryWithFriend: "Share",
      sharedItinerariesTitle: "Routes shared with you",
      heroTagline: "Discover. Explore. Remember.",
      loginTitle: "Sign in",
      registerTitle: "Create an account",
      loginSubtitle: "Welcome back! Good to see you again.",
      registerSubtitle: "Start your journey with Wayora",
      confirmPassword: "Confirm password",
      passwordMismatch: "Passwords don't match",
      continueWith: "or continue with",
      comingSoon: "Coming soon",
      loginWithYandex: "Sign in with Yandex",
      yandexError: "Couldn't sign in with Yandex.",
      submit: "Continue",
      switchToRegister: "No account yet? Register",
      switchToLogin: "Already have an account? Log in",
      savedPlaces: "Saved places",
      viewedPlaces: "Viewed places",
      visitedPlaces: "Visited places",
      noSavedPlaces: "No saved places yet",
      noViewedPlaces: "No viewed places yet",
      noVisitedPlaces: "No visited places yet",
      chooseAvatar: "Choose an avatar",
      clearViewed: "Clear",
      clearViewedConfirm: "Clear all viewed places? This can't be undone.",
      clearSaved: "Clear",
      clearSavedConfirm: "Clear all saved places? This can't be undone.",
      clearVisited: "Clear",
      clearVisitedConfirm: "Clear all visited places? This can't be undone.",
      cancel: "Cancel",
      ok: "OK",
      delete: "Delete",
      addToItinerary: "Add to itinerary",
      addAllToItinerary: "Add all",
      addRegionToItinerary: "Add all in this region to itinerary",
      favoritesStatsSaved: "Places saved",
      favoritesStatsRegions: "Regions",
      favoritesStatsDays: "Enough for a trip",
      favoritesStatsDaysUnit: "days",
      favoritesCtaTitle: "Great!",
      favoritesCtaBody: "You have enough places for a {days}-day trip.",
      favoritesCtaButton: "Build itinerary",
      favoritesProgressTitle: "Progress by region",
      favoritesProgressPlacesUnit: "places",
      favoritesMapOpen: "Open map",
      removeFromFavorites: "Remove from saved",
      inItinerary: "In itinerary",
      clearItinerary: "Clear itinerary",
      clearItineraryConfirm: "All days and stops will be removed.",
      dayLabel: "Day {n}",
      generateItinerary: "Generate",
      generateItineraryDays: "Days",
      generateItineraryHoursPerDay: "Hours per day",
      generateItinerarySourceFavorites: "Favorites",
      generateItinerarySourceRecommended: "Recommended",
      generateItinerarySubmit: "Build",
      generateItineraryConfirm: "This will replace your current itinerary. Continue?",
      generateItineraryEmpty: "Couldn't build a route. Try a different city or source.",
      dayStart: "Start",
      lunchBreak: "Lunch",
      addDay: "Add day",
      removeDay: "Remove day",
      removeDayConfirm: "Remove this day and all its stops? This can't be undone.",
      dayPlaceCount: "{count} places",
      addLocation: "Add location",
      addLocationTitle: "Add location",
      addLocationEmpty: "No results",
      stepsApprox: "~{count} steps",
      markVisited: "Mark as visited",
      notesPlaceholder: "Note for this stop…",
      dayNotesPlaceholder: "Note for the day…",
      notesDone: "Done",
      newItinerary: "Create itinerary",
      deleteItinerary: "Delete itinerary",
      deleteItineraryConfirm: "«name» will be permanently deleted.",
      maxItinerariesReached: "You can create up to 3 itineraries at a time.",
      stopDurationCustom: "Custom",
      resetDuration: "reset",
      lunchStartTime: "after",
      lunchDuration: "min",
      tabRoute: "Route",
      tabSaved: "Saved",
      tabHistory: "History",
      tabProfile: "Profile",
      tabMap: "Map",
      pushNotificationsTitle: "Push notifications",
      pushNotificationsHint: "Seasonal reminders and Wayora news",
      pushNotificationsDenied: "Notifications are disabled in system settings",
      nearbyAlertsTitle: "Nearby locations",
      nearbyAlertsHint: "Get notified when you're within 500 m of a favorite location",
      nearbyAlertsPermissionDenied: "\"Allow all the time\" location access needed",
      nearbyAlertsPermissionHint: "Grant location access in settings to get notified about nearby favorites even when the app is closed.",
      openSettings: "Open settings",
      offlineMapsTitle: "Offline maps",
      offlineMapsHint: "Manage your downloaded maps",
      offlineMapDownload: "Download",
      offlineMapDelete: "Delete",
      offlineMapDeleteConfirm: "Delete the “{name}” map?",
      offlineMapDeleteConfirmBody: "Downloaded tiles will be removed from this device.",
      offlineMapDownloadError: "Couldn't download the map. Try again later.",
      offlineMapsDownloadedSummary: "{count} of {total} downloaded · {size} MB used",
      offlineMapsEmpty: "No downloaded maps yet. Download a region's map from the Map screen.",
      offlineMapsInfoHint: "To download a region's map for offline use, open it on the Map screen and tap the cloud icon.",
      statsSaved: "Saved",
      statsRoutes: "Routes",
      travelerBadge: "Traveler",
      notificationsCardTitle: "Notifications",
      notificationHistoryTitle: "Notification history",
      notificationHistoryEmpty: "No notifications yet",
      notificationHistoryClearAll: "Clear all",
      notificationHistoryDelete: "Delete",
      appSettingsTitle: "App settings",
      themeTitle: "Theme",
      themeLight: "Light",
      themeDark: "Dark",
      themeSystem: "System",
      unitsTitle: "Distance units",
      unitsKm: "Km",
      unitsMi: "Miles",
      storageTitle: "Storage & data",
      clearCache: "Clear cache",
      clearCacheConfirmTitle: "Clear cache?",
      clearCacheConfirmBody: "Downloaded offline photos will be removed from this device. City maps stay intact.",
      clearCacheDone: "Cache cleared",
      resetSettings: "Reset settings",
      resetSettingsConfirmTitle: "Reset settings?",
      resetSettingsConfirmBody: "Theme, language, units, and nearby-location alerts will revert to their defaults.",
      aboutTitle: "About",
      aboutVersion: "Version",
      aboutSupport: "Support",
      aboutWebsite: "wayora.ru website",
      languageTitle: "App language",
      logoutConfirmTitle: "Log out?",
      logoutConfirmBody: "You'll need to sign in again to access your itineraries and favorites.",
      myRoute: "My route",
      myRouteEmpty: "You don't have a route yet",
      createItinerary: "Create itinerary",
      clearRoute: "Clear",
      clearRouteConfirm: "Route is empty",
      dayEmptyPlaceholder: "Build a route automatically or add a day manually.",
      saved: "Saved",
      history: "History",
      visited: "Visited places",
      viewed: "Viewed places",
      moveToDay: "Move to day",
      day: "Day",
      startLabel: "Start",
      lunchLabel: "Lunch",
      walkLabel: "min",
      lunchAtLabel: "Lunch at",
      resetLabel: "reset",
      buildRoute: "Build a route",
      generate: "Generate",
      tripStartDate: "Set trip start date",
      tripStartDateSet: "Trip starts {date}",
      city: "City",
      source: "Place source",
      days: "Days",
      hoursPerDay: "Hours per day",
      searchPlacesPlaceholder: "Search places",
      hourUnit: "h",
      mapPointFallbackName: "Map point",
      loginError: "Incorrect email or password.",
      registerError: "Couldn't register.",
      guestPrompt: "Log in to save places, mark them visited, and plan routes",
      bootErrorTitle: "Couldn't load data",
      bootErrorBody: "Check your internet connection and try again.",
      retry: "Retry",
      offlineModeBanner: "No connection — showing saved data"
    },
    report: {
      cta: "Found an inaccuracy in this description?",
      title: "Report an inaccuracy",
      placeholder: "Describe what's inaccurate...",
      submit: "Send",
      sending: "Sending…",
      cancel: "Cancel",
      thanks: "Thanks for the feedback! We'll take a look soon.",
      close: "Close",
      error: "Couldn't send it. Please try again."
    }
  },
};

export function getTranslations(language: Language) {
  return translations[language];
}
