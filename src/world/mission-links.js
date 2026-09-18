import * as THREE from 'three'

/**
 * Draws read-only visual relationships between persistent AgentProfiles and
 * their explicitly assigned mission threads.
 */
export class MissionLinks {
  constructor(scene) {
    this.group = new THREE.Group()
    this.group.name = 'agent-mission-topology'
    scene.add(this.group)
  }

  sync(links, buildings, plots) {
    this.clear()
    for (const link of links || []) {
      const agent = buildings.get(link.agentThreadId)
      const mission = buildings.get(link.missionThreadId)
      if (!agent || !mission || agent.retiring || mission.retiring) continue

      const start = agent.mesh.position.clone()
      const end = mission.mesh.position.clone()
      const midpoint = start.clone().lerp(end, 0.5)
      start.y += 0.35
      end.y += 0.35
      midpoint.y += 0.85

      const plot = plots.get(link.project)
      const material = new THREE.LineBasicMaterial({
        color: plot?.accent ?? 0x8f92ff,
        transparent: true,
        opacity: 0.58,
        depthWrite: false,
      })
      const geometry = new THREE.BufferGeometry().setFromPoints([start, midpoint, end])
      const line = new THREE.Line(geometry, material)
      line.renderOrder = 2
      line.userData.agentThreadId = link.agentThreadId
      line.userData.missionThreadId = link.missionThreadId
      this.group.add(line)
    }
  }

  clear() {
    for (const child of [...this.group.children]) {
      this.group.remove(child)
      child.geometry?.dispose()
      child.material?.dispose()
    }
  }

  dispose() {
    this.clear()
    this.group.removeFromParent()
  }
}
