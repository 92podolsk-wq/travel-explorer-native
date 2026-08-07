import { registerRootComponent } from 'expo';
import { registerWidgetTaskHandler } from 'react-native-android-widget';

import './src/shared/geofencing/nearby-locations-task';
import { tripCountdownWidgetTaskHandler } from './src/widgets/trip-countdown/TripCountdownWidget';
import App from './App';

registerWidgetTaskHandler(tripCountdownWidgetTaskHandler);

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
