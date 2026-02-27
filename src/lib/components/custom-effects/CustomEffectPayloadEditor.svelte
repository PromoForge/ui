<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { EditorView, basicSetup } from 'codemirror'
  import { json } from '@codemirror/lang-json'
  import { EditorState } from '@codemirror/state'

  let {
    value = $bindable(''),
  }: {
    value: string
  } = $props()

  let editorContainer: HTMLDivElement
  let view: EditorView | undefined

  const REFERENCE_LINES = [
    { label: 'Reference an attribute:', code: '"attributePayload": "${$Profile.Attributes.Name}"' },
    { label: 'Reference a parameter:', code: '"parameterPayload": "${$ParameterName}"' },
    { label: "For parameters of type 'list of strings', omit the quotes:", code: '"listOfStringsParameter": ${$ParameterName}' },
  ]

  onMount(() => {
    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        value = update.state.doc.toString()
      }
    })

    view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          json(),
          updateListener,
          EditorView.theme({
            '&': {
              fontSize: '13px',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
            },
            '.cm-content': {
              fontFamily: 'var(--font-mono)',
              padding: '8px 0',
            },
            '.cm-gutters': {
              backgroundColor: 'var(--color-muted)',
              color: 'var(--color-muted-foreground)',
              border: 'none',
              borderRadius: 'var(--radius) 0 0 var(--radius)',
            },
            '.cm-activeLine': {
              backgroundColor: 'var(--color-accent)',
            },
            '&.cm-focused': {
              outline: '2px solid var(--color-ring)',
              outlineOffset: '-1px',
            },
          }),
        ],
      }),
      parent: editorContainer,
    })
  })

  $effect(() => {
    if (view && value !== view.state.doc.toString()) {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: value,
        },
      })
    }
  })

  onDestroy(() => {
    view?.destroy()
  })
</script>

<div class="space-y-3">
  <div>
    <h3 class="text-base font-medium">Payload</h3>
  </div>

  <div class="rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 space-y-2">
    {#each REFERENCE_LINES as line}
      <div>
        <p class="text-xs text-muted-foreground">{line.label}</p>
        <code class="text-xs font-mono text-foreground">{line.code}</code>
      </div>
    {/each}
  </div>

  <div>
    <span class="text-sm font-medium">Effect payload</span>
    <div bind:this={editorContainer} class="mt-1.5 min-h-[200px]"></div>
  </div>
</div>
