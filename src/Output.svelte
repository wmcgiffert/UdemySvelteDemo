<script>
    export let goal;
</script>

<div>
    <h1 class:empahsised={goal.includes('!')}>My Goal is to : {goal}</h1>  
</div>

<style>
    .empahsised{
        color: red;
    }
</style>