(function() {

  tabris.Properties = {

    set: function(arg1, arg2, arg3) {
      this._checkDisposed();
      if (typeof arg1 === "string") {
        this._setProperty(arg1, arg2, arg3 || {});
      } else {
        this._setProperties(arg1, arg2 || {});
      }
      return this;
    },

    get: function(name) {
      this._checkDisposed();
      var getter = this._getPropertyGetter(name) || this._getStoredProperty;
      var value = getter.call(this, name);
      return this._decodeProperty(value, this._getPropertyType(name));
    },

    _setProperties: function(properties, options) {
      for (var name in properties) {
        this._setProperty(name, properties[name], options);
      }
    },

    _setProperty: function(name, value, options) {
      var type = this._getPropertyType(name);
      var encodedValue;
      try {
        encodedValue = this._encodeProperty(value, type);
      } catch (ex) {
        console.warn(this.toString() + ": Ignored unsupported value for property \"" + name + "\": " + ex.message);
        return;
      }
      var setter = this._getPropertySetter(name) || this._storeProperty;
      setter.call(this, name, encodedValue, options);
    },

    _storeProperty: function(name, encodedValue, options) {
      var oldEncodedValue = this._getStoredProperty(name);
      if (encodedValue === oldEncodedValue) {
        return;
      }
      if (encodedValue === undefined && this._props) {
        delete this._props[name];
      } else {
        if (!this._props) {
          this._props = {};
        }
        this._props[name] = encodedValue;
      }
      this._triggerChangeEvent(name, encodedValue, options);
    },

    _getStoredProperty: function(name) {
      var result = this._props ? this._props[name] : undefined;
      if (result === undefined) {
        result = this._getDefaultPropertyValue(name);
      }
      return result;
    },

    _getPropertyType: function(name) {
      var prop = this.constructor._properties[name];
      return prop ? prop.type : null;
    },

    _getDefaultPropertyValue: function(name) {
      var prop = this.constructor._properties[name];
      return prop ? valueOf(prop.default) : undefined;
    },

    _encodeProperty: function(value, type) {
      if (typeof type === "string" && tabris.PropertyEncoding[type]) {
        return tabris.PropertyEncoding[type](value);
      }
      if (Array.isArray(type) && tabris.PropertyEncoding[type[0]]) {
        var args = [value].concat(type.slice(1));
        return tabris.PropertyEncoding[type[0]].apply(window, args);
      }
      return value;
    },

    _triggerChangeEvent: function(propertyName, newEncodedValue, options) {
      var type = this._getPropertyType(propertyName);
      var decodedValue = this._decodeProperty(newEncodedValue, type);
      this.trigger("change:" + propertyName, this, decodedValue, options || {});
    },

    _decodeProperty: function(value, type) {
      if (typeof type === "string" && tabris.PropertyDecoding[type]) {
        return tabris.PropertyDecoding[type](value);
      }
      if (Array.isArray(type) && tabris.PropertyDecoding[type[0]]) {
        var args = [value].concat(type.slice(1));
        return tabris.PropertyDecoding[type[0]].apply(window, args);
      }
      return value;
    },

    _getPropertyGetter: function(name) {
      var prop = this.constructor._properties[name];
      return prop ? prop.get : undefined;
    },

    _getPropertySetter: function(name) {
      var prop = this.constructor._properties[name];
      return prop ? prop.set : undefined;
    },

    _checkDisposed: function() {},
    trigger: function() {}

  };

  function valueOf(value) {
    return value instanceof Function ? value() : value;
  }

}());
