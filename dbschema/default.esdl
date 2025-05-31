module default {
  type User {
    required property name -> str;
    property email -> str {
      constraint exclusive;
    }
  }
};
