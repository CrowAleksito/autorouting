import { getSimpleRouteJson } from "solver-utils"
import { test, expect } from "bun:test"
import { Circuit } from "@tscircuit/core"
import { getDebugSvg } from "../../../infinite-grid-ijump-astar/tests/fixtures/get-debug-svg"
import { MultilayerIjump } from "../../MultilayerIjump"

const Pad = (props: {
  name: string
  pcbX: number
  pcbY: number
  width?: string
  height?: string
}) => (
  <chip name={props.name} pcbX={props.pcbX} pcbY={props.pcbY}>
    <footprint>
      <smtpad
        pcbX={0}
        pcbY={0}
        shape="rect"
        width={props.width ?? "0.6mm"}
        height={props.height ?? "0.6mm"}
        layer="top"
        portHints={["pin1"]}
      />
    </footprint>
  </chip>
)

test("repro3: wild trace jump when goal alignment is blocked by adjacent pad", () => {
  const circuit = new Circuit()

  circuit.add(
    <board width="16mm" height="24mm" routingDisabled>
      <Pad
        name="U_start"
        pcbX={-0.1}
        pcbY={-12.6}
        width="0.6mm"
        height="0.6mm"
      />
      <Pad
        name="U_below_start"
        pcbX={0.5}
        pcbY={-16.0}
        width="3.0mm"
        height="5.9mm"
      />
      <Pad
        name="U_mid_block"
        pcbX={-2.0}
        pcbY={-14.2}
        width="2.2mm"
        height="5.0mm"
      />
      <Pad
        name="R2_block"
        pcbX={-4.5}
        pcbY={-11.15}
        width="0.6mm"
        height="0.6mm"
      />
      <Pad
        name="R1_goal"
        pcbX={-4.5}
        pcbY={-15.0}
        width="0.6mm"
        height="0.6mm"
      />
      <Pad
        name="U_top_right"
        pcbX={-0.75}
        pcbY={-2.0}
        width="0.4mm"
        height="0.8mm"
      />
      <Pad
        name="U_top_left"
        pcbX={-4.5}
        pcbY={-2.0}
        width="0.4mm"
        height="0.8mm"
      />
      <trace from=".U_start > .pin1" to=".R1_goal > .pin1" />
    </board>,
  )

  const inputCircuitJson = circuit.getCircuitJson()
  const input = getSimpleRouteJson(inputCircuitJson, { layerCount: 2 })

  const autorouter = new MultilayerIjump({
    input,
    debug: true,
  })

  const solution = autorouter.solveAndMapToTraces()

  expect(solution).toHaveLength(1)

  for (const point of solution[0].route) {
    expect(point.y).toBeLessThan(-9)
  }

  expect(
    getDebugSvg({
      inputCircuitJson,
      autorouter,
      solution,
      rowHeight: 24,
      colWidth: 20,
      colCount: 5,
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
