import { Goal, LtGoal } from '@/models/goal'
import { GoalUpdate } from '@/models/goalUpdate'

export function getGoalExportText(
  goal: LtGoal | Goal,
  isLongTerm: boolean,
  goalUpdates: GoalUpdate[]
) {
  const linkedTrackersBlock = goal.relatedTrackers?.length
    ? `Linked trackers:\n${goal.relatedTrackers.map((t) => `- ${t.name} (${t.type})`).join('\n')}`
    : 'Linked trackers: None'

  const relationsBlock = isLongTerm
    ? (() => {
        const lt = goal as LtGoal

        return [
          `Related goals:`,
          `- Active: ${lt.relatedGoals?.length ? lt.relatedGoals.map((g) => g.name).join(', ') : 'None'}`,
          `- Delayed: ${lt.delayedRelatedGoals?.length ? lt.delayedRelatedGoals.map((g) => g.name).join(', ') : 'None'}`,
          `- Completed: ${lt.completedRelatedGoals?.length ? lt.completedRelatedGoals.map((g) => g.name).join(', ') : 'None'}`,
          `- Abandoned: ${lt.abandonedRelatedGoals?.length ? lt.abandonedRelatedGoals.map((g) => g.name).join(', ') : 'None'}`,
        ].join('\n')
      })()
    : (() => {
        const g = goal as Goal

        return [
          `Prerequisites: ${g.prerequisites?.length ? g.prerequisites.map((g) => g.name).join(', ') : 'None'}`,
          `Consequences: ${g.consequences?.length ? g.consequences.map((g) => g.name).join(', ') : 'None'}`,
          `Related long-term goals: ${g.relatedLtGoals?.length ? g.relatedLtGoals.map((g) => g.name).join(', ') : 'None'}`,
        ].join('\n')
      })()

  const goalUpdatesReversed = goalUpdates.toReversed()

  const updatesBlock = goalUpdatesReversed.length
    ? goalUpdatesReversed
        .map((goalUpdate, ind) => {
          const dateIso = `${goalUpdate.createdAt.date.toISOString()}`

          const parts = [
            `Update ${ind + 1}:`,
            `- Date: ${dateIso}`,
            `- Sentiment: ${goalUpdate.sentiment}`,
            `- Type: ${goalUpdate.type === 'status_change' ? 'Status change' : 'Note'}`,
          ]

          if (goalUpdate.type === 'status_change') {
            parts.push(`- Status change: ${goalUpdate.statusChange}`)

            if (goalUpdate.relatedGoalName) {
              parts.push(
                `- Related goal: ${goalUpdate.relatedGoalName}${goalUpdate.relatedGoalStatus ? ` (${goalUpdate.relatedGoalStatus})` : ''}`
              )
            }
          }

          if (goalUpdate.content) parts.push(`- Content: ${goalUpdate.content}`)
          if (goalUpdate.isPinned) parts.push(`- Pinned: yes`)

          return parts.join('\n')
        })
        .join('\n\n')
    : '- None'

  return `Goal export from Lumex
----------------
Name: ${goal.name}
Type: ${isLongTerm ? 'Long-term' : 'Normal'}
Status: ${goal.status}
Created at: ${goal.createdAt.toISOString()}
Closed at: ${goal.closeDate ? goal.closeDate.toISOString() : 'Still active'}
Why: ${goal.why ? goal.why : 'Not specified'}

${linkedTrackersBlock}
${relationsBlock}

Goal updates:
${updatesBlock}

----------------
End of export`
}
