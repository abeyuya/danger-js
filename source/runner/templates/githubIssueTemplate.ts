import v from "voca"

import { DangerResults } from "../../dsl/DangerResults"
import { Violation, isInline } from "../../dsl/Violation"

/**
 * Converts a set of violations into a HTML table
 *
 * @param {string} name User facing title of table
 * @param {string} emoji Emoji name to show next to each item
 * @param {Violation[]} violations for table
 * @returns {string} HTML
 */
function table(name: string, emoji: string, violations: Violation[]): string {
  if (violations.length === 0 || violations.every(violation => !violation.message)) {
    return ""
  }
  return `
<table>
  <thead>
    <tr>
      <th width="50"></th>
      <th width="100%" data-danger-table="true">${name}</th>
    </tr>
  </thead>
  <tbody>${violations
    .map((v: Violation) => {
      const message = isInline(v) ? `**${v.file!}#L${v.line!}** - ${v.message}` : v.message
      return `<tr>
      <td>:${emoji}:</td>
      <td>

  ${message}
  </td>
    </tr>
  `
    })
    .join("\n")}</tbody>
</table>
`
}

function getSummary(label: string, violations: Violation[]): string {
  return violations
    .map(x => v.truncate(x.message, 20))
    .reduce(
      (acc, value, idx) => `${acc} ${value}${idx === violations.length - 1 ? "" : ","}`,
      `${violations.length} ${label}: `
    )
}

function buildSummaryMessage(dangerID: string, results: DangerResults): string {
  const { fails, warnings, messages, markdowns } = results
  const summary = `  ${getSummary("failure", fails)}
  ${getSummary("warning", warnings)}
  ${messages.length > 0 ? `${messages.length} messages` : ""}
  ${markdowns.length > 0 ? `${markdowns.length} markdown notices` : ""}
  ${dangerIDToString(dangerID)}`
  return summary
}

export const dangerIDToString = (id: string) => `DangerID: danger-id-${id};`
export const fileLineToString = (file: string, line: number) => `  File: ${file};
  Line: ${line};`

/**
 * Postfix signature to be attached comment generated / updated by danger.
 */
export const dangerSignaturePostfix = `Generated by :no_entry_sign: <a href="http://github.com/danger/danger-js/">dangerJS</a>`

/**
 * Comment to add when updating the PR status when issues are found
 */
export const messageForResultWithIssues = `:warning: Danger found some issues. Don't worry, everything is fixable.`

/**
 * A template function for creating a GitHub issue comment from Danger Results
 * @param {string} dangerID A string that represents a unique build
 * @param {DangerResults} results Data to work with
 * @returns {string} HTML
 */
export function template(dangerID: string, results: DangerResults): string {
  return `
<!--
${buildSummaryMessage(dangerID, results)}
-->
${table("Fails", "no_entry_sign", results.fails)}
${table("Warnings", "warning", results.warnings)}
${table("Messages", "book", results.messages)}
${results.markdowns.map(v => v.message).join("\n\n")}
<p align="right">
  ${dangerSignaturePostfix}
</p>
`
}

export function inlineTemplate(dangerID: string, results: DangerResults, file: string, line: number): string {
  const printViolation = (emoji: string) => (violation: Violation) => {
    return `- :${emoji}: ${violation.message}`
  }

  return `
<!--
${buildSummaryMessage(dangerID, results)}
${fileLineToString(file, line)}
-->  
${results.fails.map(printViolation("no_entry_sign")).join("\n")}
${results.warnings.map(printViolation("warning")).join("\n")}
${results.messages.map(printViolation("book")).join("\n")}
${results.markdowns.map(v => v.message).join("\n\n")}
  `
}
