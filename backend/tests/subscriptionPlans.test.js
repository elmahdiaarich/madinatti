const test = require('node:test');
const assert = require('node:assert/strict');

const {
  PRICING_PLANS,
  PLAN_IDS,
  getBillingOption,
  getPlanDefinition,
} = require('../config/pricingPlans');
const {
  SHOP_SUBSCRIPTION_PLANS,
  SHOP_SUBSCRIPTION_PLAN_SLUGS,
} = require('../config/shopSubscriptionPlans');

test('business pricing exposes the four requested plans in order', () => {
  assert.deepEqual(PLAN_IDS, ['gratuit', 'basic', 'pro', 'max']);
  assert.equal(PRICING_PLANS.length, 4);

  const [free, basic, pro, max] = PRICING_PLANS;
  assert.equal(free.name, 'Gratuit');
  assert.equal(basic.metadata.stars, 3);
  assert.equal(pro.metadata.stars, 4);
  assert.equal(max.metadata.stars, 5);
});

test('business pricing stores requested duration and daily price options', () => {
  const basic = getPlanDefinition('basic');
  const pro = getPlanDefinition('pro');
  const max = getPlanDefinition('max');

  assert.deepEqual(
    basic.metadata.billingOptions.map(({ days, dailyPrice }) => ({ days, dailyPrice })),
    [{ days: 30, dailyPrice: 18.6 }, { days: 14, dailyPrice: 24.8 }],
  );
  assert.deepEqual(
    pro.metadata.billingOptions.map(({ days, dailyPrice }) => ({ days, dailyPrice })),
    [{ days: 30, dailyPrice: 19.3 }, { days: 14, dailyPrice: 28.5 }, { days: 7, dailyPrice: 41.2 }],
  );
  assert.equal(getBillingOption(pro, 14).price, 399);
  assert.equal(getBillingOption(max, 7).price, 413);
  assert.equal(getBillingOption(pro, 999), null);
  assert.equal(getBillingOption(pro).days, 30);
});

test('max plan keeps promotional old and current daily prices', () => {
  const max = getPlanDefinition('max');

  assert.deepEqual(
    max.metadata.billingOptions.map(({ days, dailyPrice, originalDailyPrice }) => ({ days, dailyPrice, originalDailyPrice })),
    [
      { days: 30, dailyPrice: 35.7, originalDailyPrice: 42.0 },
      { days: 14, dailyPrice: 48.5, originalDailyPrice: 57.1 },
      { days: 7, dailyPrice: 59.0, originalDailyPrice: 65.5 },
    ],
  );
});

test('shop pricing config mirrors the four public business plan levels', () => {
  assert.deepEqual(SHOP_SUBSCRIPTION_PLAN_SLUGS, ['gratuit', 'basic', 'pro', 'max']);
  assert.equal(SHOP_SUBSCRIPTION_PLANS.length, 4);
  assert.equal(SHOP_SUBSCRIPTION_PLANS.find((plan) => plan.slug === 'pro').listingLimit, 20);
  assert.match(SHOP_SUBSCRIPTION_PLANS.find((plan) => plan.slug === 'max').displayedPrice, /35\.7 DH\/j/);
});
