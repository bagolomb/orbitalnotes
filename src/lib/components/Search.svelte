<script lang="ts">
  import { Input } from "$lib/components/ui/input/index.js";

  let { found_note_ids = $bindable([]) } = $props();
</script>

<Input placeholder="Search Notes" />
