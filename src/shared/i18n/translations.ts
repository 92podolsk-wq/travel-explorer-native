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
    checklistPackingTitle: string;
    checklistShoppingTitle: string;
    checklistAddPlaceholder: string;
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
      checklistPackingTitle: "Сборы в поездку",
      checklistShoppingTitle: "Что купить / привезти",
      checklistAddPlaceholder: "Добавить пункт",
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
      retry: "Повторить"
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
      checklistPackingTitle: "Packing list",
      checklistShoppingTitle: "To buy / bring back",
      checklistAddPlaceholder: "Add an item",
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
      retry: "Retry"
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
  ja: {
    app: {
      searchPlaceholder: "場所を検索",
      poiPreviewView: "見る",
      checklistCardTitle: "旅行チェックリスト",
      checklistSetDate: "出発日を設定",
      checklistDateSet: "出発日: {date}",
      checklistPackingTitle: "持ち物リスト",
      checklistShoppingTitle: "買うもの・お土産",
      checklistAddPlaceholder: "項目を追加",
      save: "保存",
      mustVisit: "必見",
      photo: "写真",
      best: "おすすめ",
      duration: "所要時間",
      effort: "難易度",
      bestTime: "おすすめの時間",
      signals: "特徴",
      minutesShort: "分",
      visited: "訪問済み",
      share: "共有",
      linkCopied: "リンクをコピーしました",
      noSeasonPhotoHint: "この季節の写真がありません — デフォルトを表示",
      previousPlace: "前へ",
      nextPlace: "次へ",
      on: "オン",
      off: "オフ",
      kyoto: "京都",
      chooseCity: "都市を選択",
      categoryFiltersButton: "カテゴリー",
      categoryFiltersTitle: "カテゴリー",
      categoryFiltersSelectAll: "すべて選択",
      categoryFiltersClearAll: "すべて解除",
      categoryFiltersDone: "完了",
      newMarkerTitle: "新しいマーカー",
      markerLabelPlaceholder: "ラベル(任意)",
      markerCountLabel: "{count} / {limit} 件のマーカー",
      markerLimitReached: "マーカーの上限に達しました({limit}件)",
      markerSaveError: "マーカーを保存できませんでした。もう一度お試しください。",
      markerCancel: "キャンセル",
      markerSave: "保存",
      markerSaving: "保存中…",
      addMarkerToItinerary: "旅程に追加",
      removeMarkerFromItinerary: "旅程から削除",
      deleteMarker: "マーカーを削除",
      deleteMarkerConfirm: "マーカーは完全に削除されます。",
      now: "現在",
      tomorrow: "明日",
      seasonReminder: "あと{days}日で{city}で{season}シーズンが始まります",
      seasonReminderToday: "本日{city}で{season}シーズンが始まります",
      swipeDiscovery: "クイック選択",
      swipeDiscoveryHint: "場所をスワイプ:気に入ったら保存、スキップで既読に",
      swipeAffinityIntro: "好きなもの:",
      swipeEmpty: "ここにある場所はすべて確認しました。",
      swipeLike: "気に入り",
      swipeSkip: "スキップ",
      swipeProgress: "{total}件中{current}件目",
      swipeClose: "閉じる",
      swipeContinueHint: "近くの街で続ける",
      swipeContinueIn: "{region} ・ {count}件"
    },
    tag: {
      "must-visit": "必見",
      photographer: "写真向き",
      "first-visit": "初回向け",
      nature: "自然",
      autumn: "紅葉",
      sakura: "桜",
      "hidden-gem": "穴場",
      sunrise: "日の出",
      night: "夜",
      rain: "雨天",
      "public-transport": "公共交通",
      "light-trekking": "軽い山歩き"
    },
    difficulty: { easy: "簡単", moderate: "普通", active: "上級" },
    season: { spring: "春", summer: "夏", autumn: "秋", winter: "冬" },
    auth: {
      login: "ログイン",
      register: "登録",
      logout: "ログアウト",
      email: "メールアドレス",
      password: "パスワード",
      name: "名前",
      username: "ユーザー名",
      usernameHint: "3〜20文字:半角英数字とアンダースコア",
      editProfile: "プロフィールを編集",
      save: "保存",
      profileUpdated: "プロフィールを更新しました",
      hideFromSearch: "フレンド検索に表示しない",
      friendsTitle: "フレンド",
      friendsSearchPlaceholder: "ユーザー名で検索",
      friendsSearching: "検索中…",
      friendsNoResults: "ユーザーが見つかりません",
      friendsAdd: "追加",
      friendsAlreadyFriends: "フレンド済み",
      friendsRequestSent: "リクエスト送信済み",
      friendsRespondBelow: "下で対応してください",
      friendsIncomingTitle: "フレンドリクエスト",
      friendsAccept: "承認",
      friendsDecline: "拒否",
      friendsOutgoingTitle: "送信済みリクエスト",
      friendsCancel: "取消",
      friendsListTitle: "フレンド一覧",
      friendsLoading: "読み込み中…",
      friendsEmpty: "まだフレンドがいません",
      friendsRemove: "削除",
      shareChecklist: "共有",
      sharedChecklistsTitle: "共有されたチェックリスト",
      shareItineraryWithFriend: "共有",
      sharedItinerariesTitle: "共有されたルート",
      heroTagline: "見つける。めぐる。心に刻む。",
      loginTitle: "サインイン",
      registerTitle: "アカウント作成",
      loginSubtitle: "おかえりなさい！",
      registerSubtitle: "Wayoraで旅を始めましょう",
      confirmPassword: "パスワード（確認）",
      passwordMismatch: "パスワードが一致しません",
      continueWith: "または次で続ける",
      comingSoon: "近日公開",
      loginWithYandex: "Yandexでログイン",
      yandexError: "Yandexでのログインに失敗しました。",
      submit: "続ける",
      switchToRegister: "アカウントをお持ちでない方は登録",
      switchToLogin: "アカウントをお持ちの方はログイン",
      savedPlaces: "保存した場所",
      viewedPlaces: "閲覧した場所",
      visitedPlaces: "訪問した場所",
      noSavedPlaces: "保存した場所はまだありません",
      noViewedPlaces: "閲覧した場所はまだありません",
      noVisitedPlaces: "訪問した場所はまだありません",
      chooseAvatar: "アバターを選択",
      clearViewed: "消去",
      clearViewedConfirm: "閲覧履歴をすべて消去しますか？この操作は元に戻せません。",
      clearSaved: "消去",
      clearSavedConfirm: "保存した場所をすべて消去しますか？この操作は元に戻せません。",
      clearVisited: "消去",
      clearVisitedConfirm: "訪問した場所をすべて消去しますか？この操作は元に戻せません。",
      cancel: "キャンセル",
      ok: "OK",
      delete: "削除",
      addToItinerary: "ルートに追加",
      addAllToItinerary: "すべて追加",
      addRegionToItinerary: "この地域の場所をすべてルートに追加",
      favoritesStatsSaved: "保存した場所",
      favoritesStatsRegions: "地域",
      favoritesStatsDays: "旅行に十分な日数",
      favoritesStatsDaysUnit: "日間",
      favoritesCtaTitle: "素晴らしい！",
      favoritesCtaBody: "{days}日間の旅行に十分な場所があります。",
      favoritesCtaButton: "旅程を作成",
      favoritesProgressTitle: "地域別の進捗",
      favoritesProgressPlacesUnit: "件",
      favoritesMapOpen: "地図を開く",
      removeFromFavorites: "保存済みから削除",
      inItinerary: "ルートに追加済み",
      clearItinerary: "ルートを消去",
      clearItineraryConfirm: "すべての日程と地点が削除されます。",
      dayLabel: "{n}日目",
      generateItinerary: "自動作成",
      generateItineraryDays: "日数",
      generateItineraryHoursPerDay: "1日の時間",
      generateItinerarySourceFavorites: "お気に入り",
      generateItinerarySourceRecommended: "おすすめ",
      generateItinerarySubmit: "作成する",
      generateItineraryConfirm: "現在のルートは置き換えられます。続けますか？",
      generateItineraryEmpty: "ルートを作成できませんでした。別の都市や条件をお試しください。",
      dayStart: "開始",
      lunchBreak: "昼食",
      addDay: "日を追加",
      removeDay: "日を削除",
      removeDayConfirm: "この日とすべての立ち寄り先を削除しますか？この操作は元に戻せません。",
      dayPlaceCount: "{count}件",
      newItinerary: "旅程を作成",
      deleteItinerary: "旅程を削除",
      deleteItineraryConfirm: "「{title}」は完全に削除されます。",
      maxItinerariesReached: "旅程は最大3件までです。",
      stopDurationCustom: "カスタム",
      resetDuration: "リセット",
      lunchStartTime: "後",
      lunchDuration: "分",
      tabRoute: "旅程",
      tabSaved: "お気に入り",
      tabHistory: "履歴",
      tabProfile: "プロフィール",
      tabMap: "地図",
      pushNotificationsTitle: "プッシュ通知",
      pushNotificationsHint: "季節のお知らせとWayoraのニュース",
      pushNotificationsDenied: "通知はシステム設定でオフになっています",
      nearbyAlertsTitle: "近くのロケーション",
      nearbyAlertsHint: "お気に入りのロケーションから500m以内に入ったら通知します",
      nearbyAlertsPermissionDenied: "「常に許可」の位置情報アクセスが必要です",
      nearbyAlertsPermissionHint: "アプリを閉じていても近くのお気に入りを通知できるよう、設定で位置情報アクセスを許可してください。",
      openSettings: "設定を開く",
      offlineMapsTitle: "オフライン地図",
      offlineMapsHint: "ダウンロード済みの地図を管理",
      offlineMapDownload: "ダウンロード",
      offlineMapDelete: "削除",
      offlineMapDeleteConfirm: "「{name}」の地図を削除しますか？",
      offlineMapDeleteConfirmBody: "ダウンロード済みのタイルは端末から削除されます。",
      offlineMapDownloadError: "地図をダウンロードできませんでした。後でもう一度お試しください。",
      offlineMapsDownloadedSummary: "{total}件中{count}件ダウンロード済み・使用容量 {size} MB",
      offlineMapsEmpty: "ダウンロード済みの地図はまだありません。マップ画面から地域の地図をダウンロードしてください。",
      offlineMapsInfoHint: "地域の地図をオフラインでダウンロードするには、マップ画面でその地域を開き、クラウドアイコンをタップしてください。",
      statsSaved: "保存済み",
      statsRoutes: "ルート",
      travelerBadge: "旅行者",
      notificationsCardTitle: "通知",
      notificationHistoryTitle: "通知履歴",
      notificationHistoryEmpty: "通知はまだありません",
      appSettingsTitle: "アプリ設定",
      themeTitle: "テーマ",
      themeLight: "ライト",
      themeDark: "ダーク",
      themeSystem: "システムに合わせる",
      unitsTitle: "距離の単位",
      unitsKm: "km",
      unitsMi: "マイル",
      storageTitle: "ストレージとデータ",
      clearCache: "キャッシュを削除",
      clearCacheConfirmTitle: "キャッシュを削除しますか?",
      clearCacheConfirmBody: "ダウンロード済みのオフライン写真が端末から削除されます。都市の地図はそのまま残ります。",
      clearCacheDone: "キャッシュを削除しました",
      resetSettings: "設定をリセット",
      resetSettingsConfirmTitle: "設定をリセットしますか?",
      resetSettingsConfirmBody: "テーマ、言語、単位、近くのロケーション通知が初期設定に戻ります。",
      aboutTitle: "アプリについて",
      aboutVersion: "バージョン",
      aboutSupport: "サポート",
      aboutWebsite: "wayora.ru ウェブサイト",
      languageTitle: "アプリの言語",
      logoutConfirmTitle: "ログアウトしますか？",
      logoutConfirmBody: "ルートやお気に入りにアクセスするには再度ログインが必要です。",
      myRoute: "自分のルート",
      myRouteEmpty: "まだルートがありません",
      createItinerary: "ルートを作成",
      clearRoute: "消去",
      clearRouteConfirm: "ルートは空です",
      dayEmptyPlaceholder: "自動でルートを作成するか、日を手動で追加してください。",
      saved: "お気に入り",
      history: "履歴",
      visited: "訪問した場所",
      viewed: "閲覧した場所",
      moveToDay: "この日に移動",
      day: "日目",
      startLabel: "開始",
      lunchLabel: "昼食",
      walkLabel: "分",
      lunchAtLabel: "昼食",
      resetLabel: "リセット",
      buildRoute: "ルートを作成",
      generate: "自動作成",
      tripStartDate: "出発日を設定",
      tripStartDateSet: "出発日: {date}",
      city: "都市",
      source: "場所のソース",
      days: "日数",
      hoursPerDay: "1日の時間",
      searchPlacesPlaceholder: "場所を検索",
      hourUnit: "時間",
      mapPointFallbackName: "地図上の地点",
      loginError: "メールアドレスまたはパスワードが正しくありません。",
      registerError: "登録できませんでした。",
      guestPrompt: "場所の保存、訪問済みのマーク、ルート作成にはログインが必要です",
      bootErrorTitle: "データを読み込めませんでした",
      bootErrorBody: "インターネット接続を確認してもう一度お試しください。",
      retry: "再試行"
    },
    report: {
      cta: "この説明に誤りがありましたか？",
      title: "誤りを報告",
      placeholder: "誤りの内容を記入してください...",
      submit: "送信",
      sending: "送信中…",
      cancel: "キャンセル",
      thanks: "フィードバックありがとうございます！近日中に確認します。",
      close: "閉じる",
      error: "送信できませんでした。もう一度お試しください。"
    }
  }
};

export function getTranslations(language: Language) {
  return translations[language];
}
