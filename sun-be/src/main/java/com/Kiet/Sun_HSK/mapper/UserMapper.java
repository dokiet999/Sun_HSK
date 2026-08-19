package com.Kiet.Sun_HSK.mapper;

import com.Kiet.Sun_HSK.dto.response.UserResponse;
import com.Kiet.Sun_HSK.entity.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {

    UserResponse toUserResponse(User user);
}
