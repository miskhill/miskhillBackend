CREATE MIGRATION m1r3fbzddghbjtd4v2xyckdnb2rtofgbxtgo2rtcfghnl6jg5gwpga
    ONTO initial
{
  CREATE FUTURE simple_scoping;
  CREATE TYPE default::User {
      CREATE PROPERTY email: std::str {
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE REQUIRED PROPERTY name: std::str;
  };
};
