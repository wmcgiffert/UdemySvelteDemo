<script>
	let name = 'Garrett'
	let age = 33;

	function incrementAge(){
		age += 1;
	}
</script>

<style>
	h1 {
		color: purple;
	}
</style>

<h1>Hello I am {name}, and I {age} years old!</h1>
<button on:click={incrementAge}>Change age</button>
