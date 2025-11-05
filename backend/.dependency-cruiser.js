module.exports = {
  ruleSet: {
    forbidden: [
    // Detect files that no other file depends on (potentially dead/orphan)
      { name: 'no-orphans', severity: 'error', from: {}, to: { orphan: true } },

    // Enforce Clean Architecture boundaries (high-level)
    // application must not import infrastructure
      {
        name: 'app-no-infra',
        severity: 'error',
        from: { path: '^src/application' },
        to: { path: '^src/infrastructure' }
      },
    // presentation must not import infrastructure directly
      {
        name: 'presentation-no-infra',
        severity: 'error',
        from: { path: '^src/presentation' },
        to: { path: '^src/infrastructure' }
      },
    // domain must not depend on outer layers
      {
        name: 'domain-is-innermost',
        severity: 'error',
        from: { path: '^src/domain' },
        to: { pathNot: '^src/domain' }
      }
    ]
  },
  options: {
    doNotFollow: {
      // Ignore node_modules
      path: 'node_modules'
    },
    exclude: {
      path: ['^tests', '^examples', '^out', '^logs']
    },
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/|src/shared/|src/domain/.*/enums/'
      }
    },
    tsPreCompilationDeps: false,
    enhancedResolveOptions: {
      extensions: ['.js', '.json']
    }
  }
};


