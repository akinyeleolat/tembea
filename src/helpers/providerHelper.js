import { MAX_INT as all } from './constants';

export default class ProviderHelper {
  /* eslint no-unused-vars: ["error", { "ignoreRestSiblings": true }] */
  static serializeDetails(modelDetails) {
    let info = {};
    if (modelDetails) {
      const {
        createdAt, updatedAt, deletedAt, ...details
      } = modelDetails;
      info = details;
    }
    return info;
  }

  static get defaultPageable() {
    return {
      page: 1,
      size: all
    };
  }

  static paginateData(totalPages, page, totalResults, pageSize, status, key) {
    return {
      pageMeta: {
        totalPages, page, totalResults, pageSize
      },
      [key]: status
    };
  }

  /**
   * Generates a list of providers label
   *
   * @static
   * @param {Array} providers - A list of providers
   * @returns {Array} Generated list of providers label
   * @memberof ProviderHelper
   */
  static generateProvidersLabel(providers) {
    return providers.map((provider) => {
      const {
        name: label,
        providerUserId,
        user: { slackId }
      } = provider;
      const valueDetails = [label, providerUserId, slackId].toString();
      const data = {
        label,
        value: valueDetails
      };
      return data;
    });
  }
}
