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

  const EXAMPLE_TEMPLATE = `{
  "attributePayload": "\${$Profile.Attributes.Name}",
  "parameterPayload": "\${$ParameterName}"
}`

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

  // Sync external value changes into the editor
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
    <p class="text-sm text-muted-foreground mt-1">
      Enter the request payload as JSON content in the format displayed below.
      The parameter names in the payload and the Parameters section must match.
    </p>
  </div>

  <div class="rounded-md bg-muted p-3">
    <pre class="text-xs font-mono text-muted-foreground whitespace-pre-wrap">{EXAMPLE_TEMPLATE}</pre>
  </div>

  <div bind:this={editorContainer} class="min-h-[200px]"></div>
</div>
