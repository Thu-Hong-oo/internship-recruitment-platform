/**
 * NotificationTemplate Entity
 * Domain: Notification
 * Represents a template for generating notifications
 */
class NotificationTemplate {
  constructor(props) {
    this.id = props.id;
    this.name = props.name;
    this.notificationType = props.notificationType;
    this.deliveryMethod = props.deliveryMethod;
    this.subjectTemplate = props.subjectTemplate;
    this.bodyTemplate = props.bodyTemplate;
    this.variables = props.variables || []; // Array of variable names
    this.isActive = props.isActive !== undefined ? props.isActive : true;
    this.language = props.language || 'en';
    this.createdBy = props.createdBy;

    this.validate();
  }

  validate() {
    if (!this.name) {
      throw new Error('Template name is required');
    }
    if (!this.notificationType) {
      throw new Error('Notification type is required');
    }
    if (!this.deliveryMethod) {
      throw new Error('Delivery method is required');
    }
    if (!this.subjectTemplate) {
      throw new Error('Subject template is required');
    }
    if (!this.bodyTemplate) {
      throw new Error('Body template is required');
    }
  }

  renderSubject(variables = {}) {
    return this.interpolateTemplate(this.subjectTemplate, variables);
  }

  renderBody(variables = {}) {
    return this.interpolateTemplate(this.bodyTemplate, variables);
  }

  interpolateTemplate(template, variables) {
    let result = template;
    for (const variable of this.variables) {
      const placeholder = `{{${variable}}}`;
      const value = variables[variable] || '';
      result = result.replace(new RegExp(placeholder, 'g'), value);
    }
    return result;
  }

  addVariable(variableName) {
    if (!this.variables.includes(variableName)) {
      this.variables.push(variableName);
    }
  }

  removeVariable(variableName) {
    const index = this.variables.indexOf(variableName);
    if (index > -1) {
      this.variables.splice(index, 1);
    }
  }

  activate() {
    this.isActive = true;
  }

  deactivate() {
    this.isActive = false;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      notificationType: this.notificationType,
      deliveryMethod: this.deliveryMethod,
      subjectTemplate: this.subjectTemplate,
      bodyTemplate: this.bodyTemplate,
      variables: this.variables,
      isActive: this.isActive,
      language: this.language,
      createdBy: this.createdBy
    };
  }
}

module.exports = NotificationTemplate;