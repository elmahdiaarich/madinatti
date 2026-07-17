'use strict';

const VEHICLE_CATALOG = require('./vehicleCatalog.generated.json');

function sortValues(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
}

const SORTED_VEHICLE_CATALOG = VEHICLE_CATALOG
  .map((item) => ({ make: item.make, models: sortValues(item.models || []) }))
  .sort((a, b) => a.make.localeCompare(b.make, 'fr', { sensitivity: 'base' }));

function getVehicleCatalog() {
  return SORTED_VEHICLE_CATALOG;
}

function getVehicleMakes() {
  return SORTED_VEHICLE_CATALOG.map((item) => item.make);
}

function getVehicleModels(make) {
  const found = SORTED_VEHICLE_CATALOG.find(
    (item) => item.make.toLowerCase() === String(make || '').toLowerCase(),
  );
  return found ? found.models : [];
}

module.exports = {
  VEHICLE_CATALOG: SORTED_VEHICLE_CATALOG,
  getVehicleCatalog,
  getVehicleMakes,
  getVehicleModels,
};
