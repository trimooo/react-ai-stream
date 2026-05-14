import pc from 'picocolors'
import { runTests } from './runner.js'
import { startMockServer, type MockScenario } from './mock-server.js'

const [, , subcommand, ...rest] = process.argv

// ─── rais-compliance serve ───────────────────────────────────────────────────

if (subcommand === 'serve') {
  const portFlag = rest.indexOf('--port')
  const port = portFlag !== -1 && rest[portFlag + 1] ? parseInt(rest[portFlag + 1], 10) : 3001

  const scenarioFlag = rest.indexOf('--scenario')
  const scenario: MockScenario =
    scenarioFlag !== -1 && rest[scenarioFlag + 1]
      ? (rest[scenarioFlag + 1] as MockScenario)
      : 'normal'

  const VALID_SCENARIOS: MockScenario[] = ['normal', 'slow', 'error', 'malformed', 'chunked', 'no-done']
  if (!VALID_SCENARIOS.includes(scenario)) {
    console.error(pc.red(`Unknown scenario "${scenario}". Valid: ${VALID_SCENARIOS.join(', ')}`))
    process.exit(1)
  }

  console.log()
  console.log(pc.bold('RAIS Mock Server'))
  console.log(pc.dim(`  Scenario : ${scenario}`))
  console.log(pc.dim(`  Endpoint : http://localhost:${port}/api/chat`))
  console.log()
  console.log(pc.dim('  Test with:'))
  console.log(`    npx rais-compliance http://localhost:${port}/api/chat`)
  console.log(`    curl -N -X POST http://localhost:${port}/api/chat \\`)
  console.log(`         -H 'Content-Type: application/json' \\`)
  console.log(`         -d '{"messages":[{"role":"user","content":"hi"}]}'`)
  console.log()
  console.log(pc.dim('  Press Ctrl+C to stop.'))
  console.log()

  startMockServer({ port, scenario }).then((stop) => {
    process.on('SIGINT', () => { stop(); console.log(); process.exit(0) })
    process.on('SIGTERM', () => { stop(); process.exit(0) })
  }).catch((err) => {
    console.error(pc.red(`Failed to start server: ${(err as Error).message}`))
    process.exit(1)
  })
  // keep event loop alive — server runs until killed

} else {

  // ─── rais-compliance <endpoint> ────────────────────────────────────────────

  const endpoint = subcommand
  const flags = rest

  if (!endpoint || endpoint.startsWith('-')) {
    console.log()
    console.log(pc.bold('rais-compliance — RAIS Protocol v1 compliance test runner'))
    console.log()
    console.log('  Usage:')
    console.log('    rais-compliance <endpoint>            Run compliance tests')
    console.log('    rais-compliance serve                 Start a mock RAIS server')
    console.log()
    console.log('  Options:')
    console.log("    --messages '[{...}]'                  Custom test messages (JSON)")
    console.log('    --port <n>                            Mock server port (default: 3001)')
    console.log('    --scenario <name>                     Mock scenario (default: normal)')
    console.log('                                          normal | slow | error | malformed | chunked | no-done')
    console.log()
    console.log('  Examples:')
    console.log('    rais-compliance http://localhost:3001/api/chat')
    console.log('    rais-compliance serve --scenario slow')
    console.log('    rais-compliance serve --port 4000 --scenario malformed')
    console.log()
    process.exit(1)
  }

  const messagesFlag = flags.indexOf('--messages')
  let messages = [{ role: 'user', content: 'Say "ok" in one word.' }]

  if (messagesFlag !== -1 && flags[messagesFlag + 1]) {
    try {
      messages = JSON.parse(flags[messagesFlag + 1])
    } catch {
      console.error(pc.red('--messages must be valid JSON'))
      process.exit(1)
    }
  }

  console.log()
  console.log(pc.bold('RAIS Protocol v1 Compliance Test'))
  console.log(pc.dim(`Endpoint: ${endpoint}`))
  console.log()

  runTests(endpoint, messages).then(({ passed, warned, failed }) => {
    console.log()
    console.log(
      pc.bold(
        failed > 0
          ? pc.red(`✕  ${failed} failed · ${warned} warned · ${passed} passed`)
          : warned > 0
          ? pc.yellow(`⚠  ${warned} warned · ${passed} passed`)
          : pc.green(`✓  All ${passed} tests passed`),
      ),
    )
    console.log()
    if (failed === 0 && warned === 0) {
      const level = 'RAIS v1 Recommended'
      console.log(pc.green(`  ${level} ✓`))
      console.log()
      console.log(pc.dim('  Add this badge to your README:'))
      console.log()
      console.log(`  ![${level}](https://img.shields.io/badge/RAIS-v1%20Recommended-22c55e)`)
      console.log()
      console.log(pc.dim('  Or in HTML:'))
      console.log()
      console.log(`  <img src="https://img.shields.io/badge/RAIS-v1%20Recommended-22c55e" alt="${level}" />`)
    } else if (failed === 0) {
      const level = 'RAIS v1 Core'
      console.log(pc.green(`  ${level} certified ✓`))
      console.log(pc.dim('  Fix warnings above to reach RAIS v1 Recommended'))
      console.log()
      console.log(pc.dim('  Add this badge to your README:'))
      console.log()
      console.log(`  ![${level} certified](https://img.shields.io/badge/RAIS-v1%20Core-3b82f6)`)
    } else {
      console.log(pc.red('  Not RAIS v1 compliant'))
      console.log(pc.dim('  Fix the failures above, then re-run to generate your compliance badge.'))
      console.log()
      console.log(pc.dim('  Test with the mock server to understand expected behavior:'))
      console.log(pc.dim('    npx rais-compliance serve --scenario normal'))
    }
    console.log()
    process.exit(failed > 0 ? 1 : 0)
  })

}
