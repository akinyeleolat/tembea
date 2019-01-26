class GeneralValidator {
  /**
   * @description This method checks the object passed for the passed properties
   * @param {object} body The body of the request object
   * @param {Array<string>} props The name of the property
   * @returns {array} An array of messages of the missing properties
   */
  static validateReqBody(body, ...props) {
    const messages = [];

    props.forEach((prop) => {
      if (!body[prop]) {
        messages.push(`Please provide ${prop}.`);
      }
    });

    return messages;
  }

  /**
   * @description This method checks if the objects passed in the request body are empty
   * @param {object} body The body of the request object
   * @param {Array<string>} props The name of the property
   * @returns {array} An array of messages of the empty properties
   */
  static validateEmptyReqBodyProp(body, ...props) {
    return props
      .filter(prop => body[prop] !== undefined && !body[prop].trim().length)
      .map(prop => `Please provide a value for ${prop}.`);
  }

  static validateQueryParams(req, res, next) {
    const { page, size } = req.query;
    const nums = /^[1-9][0-9]*$/;
    if ((page && !nums.test(page)) || (size && !nums.test(size))) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a positive integer value'
      });
    }
    return next();
  }

  /**
   * @static validateProp
   * @description This method checks if the property passed is empty
   * @param {string} prop The value of the property
   * @param {string} propName The name of the property
   * @returns {array<string>} An array of the error message
   * @memberof GeneralValidator
   */
  static validateProp(prop, propName) {
    if (!prop || prop.trim().length < 1) {
      return [`Please Provide a ${propName}`];
    }
    return [];
  }
}

export default GeneralValidator;
