import PathSense from 'com.sensimity.ti.pathsense';
import beaconMapper from './../mapper/pathsense/beacon';
import beaconHandler from './../handlers/beaconHandler';

const enteredRegion = (geofenceRegion) => {
    const beacon = beaconMapper.map(geofenceRegion);
    beaconHandler.handle(beacon);
};

const init = () => PathSense.addEventListener('enteredRegion', enteredRegion);

const destruct = () => PathSense.removeEventListener('enteredRegion', enteredRegion);

const startMonitoring = (region) => PathSense.startMonitoringForRegion(region);

const stopMonitoring = () => PathSense.stopMonitoringAllRegions();

export default {
	init,
	destruct,
	startMonitoring,
	stopMonitoring,
};
