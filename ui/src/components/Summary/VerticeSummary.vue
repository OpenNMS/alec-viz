<template>
	<div class="summary">
		<div class="title">
			<slot name="title"></slot>
		</div>
		<div class="details">
			<slot name="description"> </slot>
			<slot name="connections"></slot>
		</div>
	</div>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped>
$border: 1px solid rgba(0, 0, 0, 0.125);
.summary {
	display: flex;
	flex-direction: column;
	border: $border;
	border-radius: 0.25rem;
	padding-bottom: 20px;
}

.title {
	display: flex;
	flex-direction: row;
	width: 100%;
	font-weight: 600;
	justify-content: center;
	border-bottom: $border;
	padding: 15px 0;
}

.details {
	padding-top: 20px;
	padding-left: 20px;
	padding-right: 20px;
	text-align: start;

	hr {
		margin: 20px 0;
		color: $border;
	}
}
</style>
