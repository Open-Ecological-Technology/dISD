'use strict'

/**
 * course.spec.js
 *
 * Integration-level Chai assertions for the dISD course object flow.
 * Each describe block corresponds to an output pin in course-object-flow.puml.
 * Each it() is an assertion against the typed schema of that pin.
 *
 * Artifact loading assumes yaml-datastore (dof-initiative/yaml-datastore).
 * Run with: mocha course.spec.js
 */

const { expect } = require('chai')

// ── adapt this import to your yaml-datastore API ──────────────────────────────
const store = require('yaml-datastore')

// ── valid semver regex ────────────────────────────────────────────────────────
const SEMVER = /^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/

// ── valid url regex (permissive) ──────────────────────────────────────────────
const URL_RE = /^https?:\/\/.+/

// ── helpers ───────────────────────────────────────────────────────────────────

function isNonEmptyString (val) {
  return typeof val === 'string' && val.trim().length > 0
}

function isNonEmptyArray (val) {
  return Array.isArray(val) && val.length > 0
}

// ─────────────────────────────────────────────────────────────────────────────
// PIN: CourseContext
// Input pin to Analyze Needs. Learner-supplied; validated before flow starts.
// ─────────────────────────────────────────────────────────────────────────────

describe('Pin: CourseContext', () => {
  let artifact

  before(async () => {
    artifact = await store.load('course-context')
  })

  it('has a non-empty domainProblem', () => {
    expect(artifact.domainProblem).to.satisfy(isNonEmptyString)
  })

  it('has a non-empty learnerRole', () => {
    expect(artifact.learnerRole).to.satisfy(isNonEmptyString)
  })

  it('has a non-negative integer iteration', () => {
    expect(artifact.iteration).to.be.a('number')
    expect(artifact.iteration).to.be.at.least(0)
    expect(Number.isInteger(artifact.iteration)).to.be.true
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// PIN: NeedsAnalysisArtifact
// Output pin of: Analyze Needs
// Input pin of:  Model the System
// ─────────────────────────────────────────────────────────────────────────────

describe('Pin: NeedsAnalysisArtifact', () => {
  let artifact

  before(async () => {
    artifact = await store.load('needs-analysis-artifact')
  })

  it('has a non-empty gapStatement', () => {
    expect(artifact.gapStatement).to.satisfy(isNonEmptyString)
  })

  it('has a targetAudience object', () => {
    expect(artifact.targetAudience).to.be.an('object')
  })

  it('targetAudience has a non-empty role', () => {
    expect(artifact.targetAudience.role).to.satisfy(isNonEmptyString)
  })

  it('targetAudience has a non-empty existingKnowledge array', () => {
    expect(artifact.targetAudience.existingKnowledge).to.satisfy(isNonEmptyArray)
  })

  it('has at least one performanceObjective', () => {
    expect(artifact.performanceObjectives).to.satisfy(isNonEmptyArray)
    artifact.performanceObjectives.forEach(obj => {
      expect(obj).to.satisfy(isNonEmptyString)
    })
  })

  it('has a constraints array (may be empty)', () => {
    expect(artifact.constraints).to.be.an('array')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// PIN: SystemModel
// Output pin of: Model the System
// Input pin of:  Map Learning Object Dependencies
// ─────────────────────────────────────────────────────────────────────────────

describe('Pin: SystemModel', () => {
  let artifact

  before(async () => {
    artifact = await store.load('system-model')
  })

  it('has at least one entity', () => {
    expect(artifact.entities).to.satisfy(isNonEmptyArray)
  })

  it('every entity has a non-empty name', () => {
    artifact.entities.forEach(e => {
      expect(e.name).to.satisfy(isNonEmptyString)
    })
  })

  it('has a relations array (may be empty)', () => {
    expect(artifact.relations).to.be.an('array')
  })

  it('every relation references valid entity names', () => {
    const names = new Set(artifact.entities.map(e => e.name))
    artifact.relations.forEach(r => {
      expect(names.has(r.from), `unknown entity: ${r.from}`).to.be.true
      expect(names.has(r.to),   `unknown entity: ${r.to}`  ).to.be.true
    })
  })

  it('has at least one boundary', () => {
    expect(artifact.boundaries).to.satisfy(isNonEmptyArray)
  })

  it('has a non-empty pumlSource string', () => {
    expect(artifact.pumlSource).to.satisfy(isNonEmptyString)
  })

  it('pumlSource starts with @startuml', () => {
    expect(artifact.pumlSource.trimStart()).to.match(/^@startuml/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// PIN: LearningObjectGraph
// Output pin of: Map Learning Object Dependencies
// Input pin of:  Specify Learning Objects
// ─────────────────────────────────────────────────────────────────────────────

describe('Pin: LearningObjectGraph', () => {
  let artifact

  before(async () => {
    artifact = await store.load('learning-object-graph')
  })

  it('has at least one node', () => {
    expect(artifact.nodes).to.satisfy(isNonEmptyArray)
  })

  it('every node has a non-empty id and title', () => {
    artifact.nodes.forEach(n => {
      expect(n.id).to.satisfy(isNonEmptyString)
      expect(n.title).to.satisfy(isNonEmptyString)
    })
  })

  it('node ids are unique', () => {
    const ids = artifact.nodes.map(n => n.id)
    expect(new Set(ids).size).to.equal(ids.length)
  })

  it('has an edges array (may be empty)', () => {
    expect(artifact.edges).to.be.an('array')
  })

  it('every edge references valid node ids', () => {
    const ids = new Set(artifact.nodes.map(n => n.id))
    artifact.edges.forEach(e => {
      expect(ids.has(e.from), `unknown node: ${e.from}`).to.be.true
      expect(ids.has(e.to),   `unknown node: ${e.to}`  ).to.be.true
    })
  })

  it('graph has no self-referential edges', () => {
    artifact.edges.forEach(e => {
      expect(e.from).to.not.equal(e.to)
    })
  })

  it('has a non-empty pumlSource string', () => {
    expect(artifact.pumlSource).to.satisfy(isNonEmptyString)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// PIN: LearningObjectSpec
// Output pin of: Specify Learning Objects
// Input pin of:  Write Chai Specs, Build Content Components
// ─────────────────────────────────────────────────────────────────────────────

describe('Pin: LearningObjectSpec', () => {
  let specs

  before(async () => {
    specs = await store.loadAll('learning-object-spec')
  })

  it('contains at least one spec', () => {
    expect(specs).to.satisfy(isNonEmptyArray)
  })

  specs && specs.forEach((spec, i) => {
    describe(`LearningObjectSpec[${i}] — ${spec?.id ?? 'unknown'}`, () => {
      it('has a non-empty id', () => {
        expect(spec.id).to.satisfy(isNonEmptyString)
      })

      it('has a non-empty title', () => {
        expect(spec.title).to.satisfy(isNonEmptyString)
      })

      it('has at least one objective', () => {
        expect(spec.objectives).to.satisfy(isNonEmptyArray)
      })

      it('has a prerequisites array (may be empty)', () => {
        expect(spec.prerequisites).to.be.an('array')
      })

      it('has a non-empty artifactSchema path', () => {
        expect(spec.artifactSchema).to.satisfy(isNonEmptyString)
      })

      it('has a positive integer estimatedDuration', () => {
        expect(spec.estimatedDuration).to.be.a('number')
        expect(spec.estimatedDuration).to.be.above(0)
        expect(Number.isInteger(spec.estimatedDuration)).to.be.true
      })
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// PIN: ChaiSpec
// Output pin of: Write Chai Specs
// Input pin of:  Build Content Components, Specify Delivery
// ─────────────────────────────────────────────────────────────────────────────

describe('Pin: ChaiSpec', () => {
  let specs

  before(async () => {
    specs = await store.loadAll('chai-spec')
  })

  it('contains at least one ChaiSpec', () => {
    expect(specs).to.satisfy(isNonEmptyArray)
  })

  it('every ChaiSpec references a known moduleId', async () => {
    const loSpecs = await store.loadAll('learning-object-spec')
    const ids = new Set(loSpecs.map(s => s.id))
    specs.forEach(cs => {
      expect(ids.has(cs.moduleId), `unknown moduleId: ${cs.moduleId}`).to.be.true
    })
  })

  it('every ChaiSpec has a non-empty specPath', () => {
    specs.forEach(cs => {
      expect(cs.specPath).to.satisfy(isNonEmptyString)
    })
  })

  it('every ChaiSpec has at least one assertedPin', () => {
    specs.forEach(cs => {
      expect(cs.assertedPins).to.satisfy(isNonEmptyArray)
    })
  })

  it('every ChaiSpec declares runner as mocha', () => {
    specs.forEach(cs => {
      expect(cs.runner).to.equal('mocha')
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// PIN: ContentComponent
// Output pin of: Build Content Components
// Input pin of:  Configure Pipeline
// ─────────────────────────────────────────────────────────────────────────────

describe('Pin: ContentComponent', () => {
  let components

  before(async () => {
    components = await store.loadAll('content-component')
  })

  it('contains at least one component', () => {
    expect(components).to.satisfy(isNonEmptyArray)
  })

  it('every component has a non-empty id', () => {
    components.forEach(c => {
      expect(c.id).to.satisfy(isNonEmptyString)
    })
  })

  it('every component references a known moduleId', async () => {
    const loSpecs = await store.loadAll('learning-object-spec')
    const ids = new Set(loSpecs.map(s => s.id))
    components.forEach(c => {
      expect(ids.has(c.moduleId), `unknown moduleId: ${c.moduleId}`).to.be.true
    })
  })

  it('every component has a valid format', () => {
    const VALID_FORMATS = ['md', 'yaml', 'html']
    components.forEach(c => {
      expect(VALID_FORMATS).to.include(c.format)
    })
  })

  it('every component has a valid semver version', () => {
    components.forEach(c => {
      expect(c.version).to.match(SEMVER)
    })
  })

  it('every component has a changelog array (may be empty)', () => {
    components.forEach(c => {
      expect(c.changelog).to.be.an('array')
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// PIN: DeliverySpec
// Output pin of: Specify Delivery          (ISD decision — pedagogical)
// Input pin of:  Encode Delivery as Pipeline
// ─────────────────────────────────────────────────────────────────────────────

describe('Pin: DeliverySpec', () => {
  let artifact

  before(async () => {
    artifact = await store.load('delivery-spec')
  })

  it('has a valid deliveryMechanism', () => {
    expect(['xapi', 'scorm', 'web']).to.include(artifact.deliveryMechanism)
  })

  it('has a sequencing array with at least one rule', () => {
    expect(artifact.sequencing).to.satisfy(isNonEmptyArray)
  })

  it('every sequencing rule has a non-empty moduleId and order', () => {
    artifact.sequencing.forEach(rule => {
      expect(rule.moduleId).to.satisfy(isNonEmptyString)
      expect(rule.order).to.be.a('number')
      expect(Number.isInteger(rule.order)).to.be.true
    })
  })

  it('sequencing order values are unique', () => {
    const orders = artifact.sequencing.map(r => r.order)
    expect(new Set(orders).size).to.equal(orders.length)
  })

  it('sequencing covers every LearningObjectSpec', async () => {
    const loSpecs = await store.loadAll('learning-object-spec')
    const coveredIds = new Set(artifact.sequencing.map(r => r.moduleId))
    loSpecs.forEach(spec => {
      expect(
        coveredIds.has(spec.id),
        `LearningObjectSpec ${spec.id} missing from sequencing`
      ).to.be.true
    })
  })

  it('has a non-empty learnerArtifactSchema path', () => {
    expect(artifact.learnerArtifactSchema).to.satisfy(isNonEmptyString)
  })

  it('has a feedbackRouting array with at least one route', () => {
    expect(artifact.feedbackRouting).to.satisfy(isNonEmptyArray)
  })

  it('every feedbackRoute has a source and destination', () => {
    artifact.feedbackRouting.forEach(route => {
      expect(route.source).to.satisfy(isNonEmptyString)
      expect(route.destination).to.satisfy(isNonEmptyString)
    })
  })

  it('has an evaluationTrigger object', () => {
    expect(artifact.evaluationTrigger).to.be.an('object')
  })

  it('evaluationTrigger has a non-empty event', () => {
    expect(artifact.evaluationTrigger.event).to.satisfy(isNonEmptyString)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// PIN: PipelineConfig
// Output pin of: Encode Delivery as Pipeline  (technical encoding)
// Input pin of:  Deploy
// ─────────────────────────────────────────────────────────────────────────────

describe('Pin: PipelineConfig', () => {
  let artifact

  before(async () => {
    artifact = await store.load('pipeline-config')
  })

  it('has a non-empty ciProvider', () => {
    expect(artifact.ciProvider).to.satisfy(isNonEmptyString)
  })

  it('has at least one step', () => {
    expect(artifact.steps).to.satisfy(isNonEmptyArray)
  })

  it('steps include a plantuml render step', () => {
    const names = artifact.steps.map(s => s.name ?? s.id ?? '')
    expect(names.some(n => /plantuml/i.test(n))).to.be.true
  })

  it('steps include a mocha step', () => {
    const names = artifact.steps.map(s => s.name ?? s.id ?? '')
    expect(names.some(n => /mocha/i.test(n))).to.be.true
  })

  it('steps include a deploy step', () => {
    const names = artifact.steps.map(s => s.name ?? s.id ?? '')
    expect(names.some(n => /deploy/i.test(n))).to.be.true
  })

  it('steps include a telemetry step', () => {
    const names = artifact.steps.map(s => s.name ?? s.id ?? '')
    expect(names.some(n => /telemetry|xapi/i.test(n))).to.be.true
  })

  it('has at least one trigger', () => {
    expect(artifact.triggers).to.satisfy(isNonEmptyArray)
  })

  it('has a non-empty yamlPath', () => {
    expect(artifact.yamlPath).to.satisfy(isNonEmptyString)
  })

  it('delivery mechanism is consistent with DeliverySpec', async () => {
    const deliverySpec = await store.load('delivery-spec')
    const xapiStep = artifact.steps.find(s => /xapi/i.test(s.name ?? s.id ?? ''))
    const scormStep = artifact.steps.find(s => /scorm/i.test(s.name ?? s.id ?? ''))
    if (deliverySpec.deliveryMechanism === 'xapi') {
      expect(xapiStep).to.exist
    }
    if (deliverySpec.deliveryMechanism === 'scorm') {
      expect(scormStep).to.exist
    }
  })

  it('step count is at least sequencing rule count plus fixed steps', async () => {
    const deliverySpec = await store.load('delivery-spec')
    const MIN_FIXED_STEPS = 4 // plantuml, mocha, deploy, telemetry
    expect(artifact.steps.length).to.be.at.least(
      deliverySpec.sequencing.length + MIN_FIXED_STEPS
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// PIN: DeployedCourse
// Output pin of: Deploy
// Input pin of:  Collect Telemetry
// ─────────────────────────────────────────────────────────────────────────────

describe('Pin: DeployedCourse', () => {
  let artifact

  before(async () => {
    artifact = await store.load('deployed-course')
  })

  it('has a valid semver releaseTag', () => {
    expect(artifact.releaseTag).to.match(SEMVER)
  })

  it('has a valid http(s) endpoint', () => {
    expect(artifact.endpoint).to.match(URL_RE)
  })

  it('has a valid http(s) xapiEndpoint', () => {
    expect(artifact.xapiEndpoint).to.match(URL_RE)
  })

  it('has a non-empty deployedAt timestamp', () => {
    expect(artifact.deployedAt).to.satisfy(isNonEmptyString)
    expect(new Date(artifact.deployedAt).toString()).to.not.equal('Invalid Date')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// PIN: EvaluationReport
// Output pin of: Collect Telemetry
// Input pin of:  Update Backlog
// ─────────────────────────────────────────────────────────────────────────────

describe('Pin: EvaluationReport', () => {
  let artifact

  before(async () => {
    artifact = await store.load('evaluation-report')
  })

  it('has a non-empty moduleId', () => {
    expect(artifact.moduleId).to.satisfy(isNonEmptyString)
  })

  it('has a non-empty learnerId', () => {
    expect(artifact.learnerId).to.satisfy(isNonEmptyString)
  })

  it('has a non-empty attemptId', () => {
    expect(artifact.attemptId).to.satisfy(isNonEmptyString)
  })

  it('has an artifacts array', () => {
    expect(artifact.artifacts).to.be.an('array')
  })

  it('every artifact result has a type and passedSpec boolean', () => {
    artifact.artifacts.forEach(a => {
      expect(a.type).to.satisfy(isNonEmptyString)
      expect(a.passedSpec).to.be.a('boolean')
    })
  })

  it('has a passRate between 0 and 1 inclusive', () => {
    expect(artifact.passRate).to.be.a('number')
    expect(artifact.passRate).to.be.at.least(0)
    expect(artifact.passRate).to.be.at.most(1)
  })

  it('has a weakModules array (may be empty)', () => {
    expect(artifact.weakModules).to.be.an('array')
  })

  it('has a specResults object', () => {
    expect(artifact.specResults).to.be.an('object')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// PIN: BacklogDelta
// Output pin of: Update Backlog
// Feeds back into: CourseContext (next iteration)
// ─────────────────────────────────────────────────────────────────────────────

describe('Pin: BacklogDelta', () => {
  let artifact

  before(async () => {
    artifact = await store.load('backlog-delta')
  })

  it('has an openIssues array (may be empty)', () => {
    expect(artifact.openIssues).to.be.an('array')
  })

  it('has a closedIssues array (may be empty)', () => {
    expect(artifact.closedIssues).to.be.an('array')
  })

  it('every issue has a non-empty id and description', () => {
    ;[...artifact.openIssues, ...artifact.closedIssues].forEach(issue => {
      expect(issue.id).to.satisfy(isNonEmptyString)
      expect(issue.description).to.satisfy(isNonEmptyString)
    })
  })

  it('has a positive integer nextIteration', () => {
    expect(artifact.nextIteration).to.be.a('number')
    expect(artifact.nextIteration).to.be.above(0)
    expect(Number.isInteger(artifact.nextIteration)).to.be.true
  })

  it('nextIteration is CourseContext.iteration + 1', async () => {
    const ctx = await store.load('course-context')
    expect(artifact.nextIteration).to.equal(ctx.iteration + 1)
  })

  it('has a valid trigger value', () => {
    expect(['release', 'patch', 'redesign']).to.include(artifact.trigger)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// FLOW INTEGRITY
// Cross-pin assertions that verify the object flow as a whole
// ─────────────────────────────────────────────────────────────────────────────

describe('Flow Integrity', () => {
  it('every LearningObjectSpec has a corresponding ChaiSpec', async () => {
    const loSpecs  = await store.loadAll('learning-object-spec')
    const chaiSpecs = await store.loadAll('chai-spec')
    const coveredIds = new Set(chaiSpecs.map(cs => cs.moduleId))
    loSpecs.forEach(spec => {
      expect(
        coveredIds.has(spec.id),
        `LearningObjectSpec ${spec.id} has no ChaiSpec`
      ).to.be.true
    })
  })

  it('every LearningObjectSpec has a corresponding ContentComponent', async () => {
    const loSpecs    = await store.loadAll('learning-object-spec')
    const components = await store.loadAll('content-component')
    const coveredIds = new Set(components.map(c => c.moduleId))
    loSpecs.forEach(spec => {
      expect(
        coveredIds.has(spec.id),
        `LearningObjectSpec ${spec.id} has no ContentComponent`
      ).to.be.true
    })
  })

  it('DeliverySpec.sequencing order is consistent with LearningObjectGraph edges', async () => {
    const graph        = await store.load('learning-object-graph')
    const deliverySpec = await store.load('delivery-spec')
    const orderMap     = new Map(deliverySpec.sequencing.map(r => [r.moduleId, r.order]))
    graph.edges.forEach(edge => {
      const fromOrder = orderMap.get(edge.from)
      const toOrder   = orderMap.get(edge.to)
      if (fromOrder !== undefined && toOrder !== undefined) {
        expect(fromOrder).to.be.below(
          toOrder,
          `sequencing violates prerequisite: ${edge.from} (${fromOrder}) must precede ${edge.to} (${toOrder})`
        )
      }
    })
  })

  it('EvaluationReport.passRate reflects weakModules correctly', async () => {
    const report = await store.load('evaluation-report')
    if (report.passRate < 1) {
      expect(report.weakModules.length).to.be.above(0)
    }
    if (report.passRate === 1) {
      expect(report.weakModules.length).to.equal(0)
    }
  })

  it('BacklogDelta.openIssues reference weakModules from EvaluationReport', async () => {
    const report = await store.load('evaluation-report')
    const delta  = await store.load('backlog-delta')
    const issueIds = new Set(delta.openIssues.map(i => i.id))
    report.weakModules.forEach(moduleId => {
      expect(
        issueIds.has(moduleId),
        `weakModule ${moduleId} has no corresponding open issue`
      ).to.be.true
    })
  })
})
