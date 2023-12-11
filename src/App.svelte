<script>
	import Output from "./Output.svelte";

	let goal = "please enter course goal";
</script>

<div>
	<span>Course Goal: </span>
	<textarea rows="3" cols="20" bind:value={goal}></textarea>
</div>
<Output {goal} />
