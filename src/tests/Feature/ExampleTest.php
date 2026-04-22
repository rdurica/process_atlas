<?php

it('redirects guests from the root page to login', function () {
    $response = $this->get('/');

    $response->assertRedirect(route('login'));
});
