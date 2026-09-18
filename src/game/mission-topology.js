/**
 * AW11 mission topology.
 *
 * Agency Agent remains authoritative. This module only projects the explicit
 * AgentProfile relation carried by normalized Agency Agent threads.
 */

function relationKey(projectId, agentId) {
  if (!projectId || !agentId) return ''
  return `${projectId}:${agentId}`
}

export function missionTopology(threads = []) {
  const profiles = new Map()
  for (const thread of threads) {
    if (!thread?.ref?.profile) continue
    const key = relationKey(thread.ref.projectId, thread.ref.agentId)
    if (key) profiles.set(key, thread)
  }

  const links = []
  for (const thread of threads) {
    if (!thread || thread.ref?.profile || !thread.ref?.agentId) continue
    const key = relationKey(thread.ref.projectId, thread.ref.agentId)
    const profile = profiles.get(key)
    if (!profile || profile.project !== thread.project) continue
    links.push({
      project: thread.project,
      agentId: thread.ref.agentId,
      agentName: thread.ref.agentName || profile.ref?.agentName || profile.title || '',
      agentThreadId: profile.id,
      missionThreadId: thread.id,
    })
  }

  return links.sort((a, b) =>
    a.project.localeCompare(b.project) ||
    a.agentThreadId.localeCompare(b.agentThreadId) ||
    a.missionThreadId.localeCompare(b.missionThreadId)
  )
}

export function orderProjectThreads(threads = []) {
  const profileIds = new Set(
    threads
      .filter((thread) => thread?.ref?.profile && thread.ref?.agentId)
      .map((thread) => thread.ref.agentId)
  )

  return [...threads].sort((a, b) => {
    const aLinked = a?.ref?.agentId && profileIds.has(a.ref.agentId)
    const bLinked = b?.ref?.agentId && profileIds.has(b.ref.agentId)
    const aGroup = aLinked ? `0:${a.ref.agentId}` : `1:${a?.id || ''}`
    const bGroup = bLinked ? `0:${b.ref.agentId}` : `1:${b?.id || ''}`
    const group = aGroup.localeCompare(bGroup)
    if (group) return group

    const aProfile = a?.ref?.profile === true
    const bProfile = b?.ref?.profile === true
    if (aProfile !== bProfile) return aProfile ? -1 : 1

    const created = (a?.createdAt || 0) - (b?.createdAt || 0)
    return created || String(a?.id || '').localeCompare(String(b?.id || ''))
  })
}
