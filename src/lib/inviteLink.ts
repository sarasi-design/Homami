/** An invite link looks like https://…/?invite=LUNA42: the code in it, if there is one */
export function inviteFromLink(): string | null {
  return new URLSearchParams(window.location.search).get('invite')
}

/** Takes the invite out of the address once it's been answered, so reloading doesn't ask again */
export function clearInviteFromLink() {
  const url = new URL(window.location.href)
  url.searchParams.delete('invite')
  window.history.replaceState(null, '', url.pathname + url.search + url.hash)
}

/** Someone may paste a whole invite link into the code field: keep just the code */
export function codeFromInput(value: string) {
  const match = value.match(/[?&]invite=([^&#\s]+)/i)
  return (match ? decodeURIComponent(match[1]) : value).trim().toUpperCase()
}
