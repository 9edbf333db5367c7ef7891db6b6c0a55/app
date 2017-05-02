export default {
  data() {
    return {
      auth: {},
      formInputsAreInvalid: true,
      errorMessage: undefined,
    };
  },
  methods: {
    validateAuthenticationForm() {
      for (const input of Object.keys(this.validation)) {
        this.validation[input].invalid = false;
        if (input in this.auth && !this.validation[input].regexp.test(this.auth[input])) {
          this.validation[input].invalid = true;
        }
      }

      const allValueDefined = this.valuesToValidate.every(prop => (
        typeof this.auth[prop] === 'string' && this.auth[prop].length !== 0
      ));
      const allValuesValid = Object.values(this.validation).every(prop => !prop.invalid);
      this.formInputsAreInvalid = !(allValueDefined && allValuesValid);
    },
  },
};
