'use strict';

/**
 * standing service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::standing.standing');
